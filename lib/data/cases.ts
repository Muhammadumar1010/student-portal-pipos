import { db } from '@/db';
import {
  cases,
  caseEvents,
  users,
  type Case,
  type CaseEvent,
  type CaseStatus,
  type User,
  type UserRole,
} from '@/db/schema';
import { eq, and, or, ilike, desc, count, sql } from 'drizzle-orm';
import { authorizeCaseAccess, ForbiddenError, NotFoundError } from '@/lib/auth/caseAccess';
import { canTransitionStatus, caseCompletionSchema } from '@/lib/caseStateMachine';

export interface CaseFilterOptions {
  search?: string;
  status?: CaseStatus;
  limit?: number;
  offset?: number;
}

/**
 * Generate human-readable case number: PIPOS-{YEAR}-{NUMBER}
 */
async function generateCaseNo(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const [totalCases] = await db.select({ value: count() }).from(cases);
  const nextNumber = ((totalCases?.value ?? 0) + 1).toString().padStart(5, '0');
  return `PIPOS-${currentYear}-${nextNumber}`;
}

/**
 * Role-scoped list of cases.
 * Structural enforcement:
 * - Admin: sees all
 * - Supervisor: where supervisorId = user.id
 * - Student: where studentId = user.id
 */
export async function listCasesForUser(user: User, options: CaseFilterOptions = {}) {
  const { search, status, limit = 50, offset = 0 } = options;

  let roleCondition = undefined;
  if (user.role === 'supervisor') {
    roleCondition = eq(cases.supervisorId, user.id);
  } else if (user.role === 'student') {
    roleCondition = eq(cases.studentId, user.id);
  }

  const conditions = [];
  if (roleCondition) conditions.push(roleCondition);
  if (status) conditions.push(eq(cases.status, status));

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(cases.caseNo, searchPattern),
        ilike(cases.patientName, searchPattern),
        ilike(cases.patientCode, searchPattern),
        ilike(cases.title, searchPattern),
        ilike(cases.diagnosis, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      case: cases,
      student: {
        id: users.id,
        fullName: users.fullName,
        registrationNo: users.registrationNo,
      },
    })
    .from(cases)
    .leftJoin(users, eq(cases.studentId, users.id))
    .where(whereClause)
    .orderBy(desc(cases.updatedAt))
    .limit(limit)
    .offset(offset);

  const [totalCountResult] = await db
    .select({ count: count() })
    .from(cases)
    .where(whereClause);

  return {
    cases: results.map((r) => ({
      ...r.case,
      studentName: r.student?.fullName || 'Unknown Student',
      studentRegNo: r.student?.registrationNo || '',
    })),
    totalCount: totalCountResult?.count || 0,
  };
}

/**
 * Retrieve full case details with role check
 */
export async function getCaseDetailsForUser(caseId: number, user: User) {
  // Enforce 404 security gate
  await authorizeCaseAccess(user, caseId, 'read');

  const [result] = await db
    .select()
    .from(cases)
    .where(eq(cases.id, caseId))
    .limit(1);

  if (!result) throw new NotFoundError();

  // Load student & supervisor profiles
  const [student] = await db
    .select()
    .from(users)
    .where(eq(users.id, result.studentId))
    .limit(1);

  const [supervisor] = await db
    .select()
    .from(users)
    .where(eq(users.id, result.supervisorId))
    .limit(1);

  return {
    case: result,
    student,
    supervisor,
  };
}

/**
 * Retrieve audit history for a case with role authorization
 */
export async function getCaseEventsForUser(caseId: number, user: User) {
  await authorizeCaseAccess(user, caseId, 'read');

  return db
    .select({
      id: caseEvents.id,
      caseId: caseEvents.caseId,
      userId: caseEvents.userId,
      action: caseEvents.action,
      note: caseEvents.note,
      createdAt: caseEvents.createdAt,
      actorName: users.fullName,
      actorRole: users.role,
    })
    .from(caseEvents)
    .leftJoin(users, eq(caseEvents.userId, users.id))
    .where(eq(caseEvents.caseId, caseId))
    .orderBy(desc(caseEvents.createdAt));
}

/**
 * Student-initiated case creation
 */
export async function createCaseByStudent(
  data: {
    supervisorId: string;
    title?: string;
    patientName?: string;
    patientCode?: string;
    patientAge?: string;
    patientGender?: string;
    patientContact?: string;
  },
  student: User
) {
  if (student.role !== 'student') {
    throw new ForbiddenError('Only students can self-initiate patient cases');
  }

  // Validate supervisor is active and has role supervisor
  const [supervisor] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, data.supervisorId),
        eq(users.role, 'supervisor'),
        eq(users.active, true)
      )
    )
    .limit(1);

  if (!supervisor) {
    throw new ForbiddenError('Selected supervisor is invalid or inactive');
  }

  const caseNo = await generateCaseNo();

  const [newCase] = await db
    .insert(cases)
    .values({
      caseNo,
      studentId: student.id,
      supervisorId: data.supervisorId,
      createdBy: student.id,
      status: 'Draft',
      title: data.title || (data.patientName ? `Case for ${data.patientName}` : 'New Clinical Case'),
      patientName: data.patientName || null,
      patientCode: data.patientCode || null,
      patientAge: data.patientAge || null,
      patientGender: data.patientGender || null,
      patientContact: data.patientContact || null,
    })
    .returning();

  // Audit event in same flow
  await db.insert(caseEvents).values({
    caseId: newCase.id,
    userId: student.id,
    action: 'case_created',
    note: `Initial clinical case created by student ${student.fullName}`,
  });

  return newCase;
}

/**
 * Supervisor-initiated case assignment
 */
export async function assignCaseBySupervisor(
  data: {
    studentId: string;
    title?: string;
    dueDate?: string;
    patientName?: string;
    patientCode?: string;
    diagnosis?: string;
    assignmentNote?: string;
  },
  supervisor: User
) {
  if (supervisor.role !== 'supervisor') {
    throw new ForbiddenError('Only supervisors can assign clinical cases');
  }

  // Validate student is active and has role student
  const [student] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, data.studentId),
        eq(users.role, 'student'),
        eq(users.active, true)
      )
    )
    .limit(1);

  if (!student) {
    throw new ForbiddenError('Selected student is invalid or inactive');
  }

  const caseNo = await generateCaseNo();

  const [newCase] = await db
    .insert(cases)
    .values({
      caseNo,
      studentId: data.studentId,
      supervisorId: supervisor.id,
      createdBy: supervisor.id,
      status: 'Assigned',
      dateAssigned: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || null,
      title: data.title || (data.patientName ? `Assigned Case: ${data.patientName}` : 'Assigned Clinical Case'),
      patientName: data.patientName || null,
      patientCode: data.patientCode || null,
      diagnosis: data.diagnosis || null,
    })
    .returning();

  await db.insert(caseEvents).values({
    caseId: newCase.id,
    userId: supervisor.id,
    action: 'case_assigned',
    note: data.assignmentNote || `Case assigned to student ${student.fullName} by Dr. ${supervisor.fullName}`,
  });

  return newCase;
}

/**
 * Explicit allow-list of clinical fields that can be edited by students
 */
const EDITABLE_CLINICAL_FIELDS = [
  'title',
  'dueDate',
  // Patient information
  'patientCode',
  'patientName',
  'fatherGuardianName',
  'dateOfBirth',
  'patientAge',
  'patientGender',
  'maritalStatus',
  'patientCnic',
  'patientContact',
  'emergencyContact',
  'patientAddress',
  'occupation',
  'referralSource',
  'referringClinician',
  'visitDate',
  // Clinical
  'caseCategory',
  'deviceCategory',
  'bodyRegion',
  'affectedSide',
  'diagnosis',
  'etiology',
  'dateOfOnset',
  'surgeryHistory',
  'medicalHistory',
  'comorbidities',
  'medications',
  'allergies',
  'previousDeviceHistory',
  // Assessment
  'chiefComplaint',
  'painAssessment',
  'skinCondition',
  'edema',
  'romFindings',
  'musclePower',
  'sensation',
  'balanceCoordination',
  'gaitFunctionalAssessment',
  'adlStatus',
  'clinicalFindings',
  'assessment',
  'measurements',
  // Prescription / treatment
  'prescription',
  'deviceType',
  'componentSelection',
  'materialsUsed',
  'castingScanning',
  'fabricationTreatment',
  'fittingAlignment',
  'modifications',
  'patientTraining',
  'safetyInstructions',
  // Outcome
  'outcome',
  'goalsAchieved',
  'followUpPlan',
  'nextVisitDate',
  'studentReflection',
  'attachmentsNote',
] as const;

/**
 * Save draft / update clinical fields
 */
export async function updateCaseFields(
  caseId: number,
  data: Record<string, unknown>,
  user: User
) {
  // Authorize write access (checks ownership & status)
  const existingCase = await authorizeCaseAccess(user, caseId, 'write');

  // Filter payload through explicit allow-list (mass-assignment protection)
  const sanitizedUpdate: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  for (const field of EDITABLE_CLINICAL_FIELDS) {
    if (field in data) {
      sanitizedUpdate[field] = data[field] === '' ? null : data[field];
    }
  }

  // If status was 'Draft' or 'Assigned', transition to 'In Progress' upon active editing
  if (existingCase.status === 'Draft' || existingCase.status === 'Assigned') {
    sanitizedUpdate.status = 'In Progress';
  }

  const [updatedCase] = await db
    .update(cases)
    .set(sanitizedUpdate)
    .where(eq(cases.id, caseId))
    .returning();

  // Audit event
  await db.insert(caseEvents).values({
    caseId,
    userId: user.id,
    action: 'case_updated',
    note: `Clinical case draft saved by student ${user.fullName}`,
  });

  return updatedCase;
}

/**
 * Student marks case complete and submits for supervisor review
 */
export async function submitCaseForReview(caseId: number, user: User) {
  const existingCase = await authorizeCaseAccess(user, caseId, 'write');

  // Run required fields validation
  const validationResult = caseCompletionSchema.safeParse(existingCase);
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const isResubmission = existingCase.status === 'Revision Required';
  const targetStatus: CaseStatus = 'Completed - Awaiting Approval';

  if (!canTransitionStatus(existingCase.status as CaseStatus, targetStatus, user.role as UserRole)) {
    throw new ForbiddenError(
      `Cannot transition case from status '${existingCase.status}' to '${targetStatus}'`
    );
  }

  const [updatedCase] = await db
    .update(cases)
    .set({
      status: targetStatus,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(cases.id, caseId))
    .returning();

  await db.insert(caseEvents).values({
    caseId,
    userId: user.id,
    action: isResubmission ? 'case_resubmitted' : 'case_submitted',
    note: isResubmission
      ? `Case resubmitted for approval following revision by ${user.fullName}`
      : `Case marked complete and submitted for review by ${user.fullName}`,
  });

  return { success: true, case: updatedCase };
}

/**
 * Supervisor approves case
 */
export async function approveCase(caseId: number, supervisor: User, comments?: string) {
  const existingCase = await authorizeCaseAccess(supervisor, caseId, 'read');

  if (supervisor.role !== 'supervisor' || existingCase.supervisorId !== supervisor.id) {
    throw new ForbiddenError('Only the assigned supervisor can approve this case');
  }

  const targetStatus: CaseStatus = 'Approved';
  if (!canTransitionStatus(existingCase.status as CaseStatus, targetStatus, supervisor.role as UserRole)) {
    throw new ForbiddenError(
      `Cannot approve case in status '${existingCase.status}'`
    );
  }

  const [updatedCase] = await db
    .update(cases)
    .set({
      status: targetStatus,
      approvedAt: new Date(),
      reviewedAt: new Date(),
      supervisorComments: comments || existingCase.supervisorComments,
      updatedAt: new Date(),
    })
    .where(eq(cases.id, caseId))
    .returning();

  await db.insert(caseEvents).values({
    caseId,
    userId: supervisor.id,
    action: 'case_approved',
    note: comments ? `Approved with remarks: "${comments}"` : 'Case officially approved by supervisor',
  });

  return updatedCase;
}

/**
 * Supervisor returns case for revision (comment mandatory)
 */
export async function returnCaseForRevision(caseId: number, supervisor: User, note: string) {
  if (!note || note.trim().length === 0) {
    throw new ForbiddenError('Revision comments are mandatory when returning a case');
  }

  const existingCase = await authorizeCaseAccess(supervisor, caseId, 'read');

  if (supervisor.role !== 'supervisor' || existingCase.supervisorId !== supervisor.id) {
    throw new ForbiddenError('Only the assigned supervisor can request revisions');
  }

  const targetStatus: CaseStatus = 'Revision Required';
  if (!canTransitionStatus(existingCase.status as CaseStatus, targetStatus, supervisor.role as UserRole)) {
    throw new ForbiddenError(
      `Cannot return case for revision from status '${existingCase.status}'`
    );
  }

  const [updatedCase] = await db
    .update(cases)
    .set({
      status: targetStatus,
      reviewedAt: new Date(),
      supervisorComments: note,
      updatedAt: new Date(),
    })
    .where(eq(cases.id, caseId))
    .returning();

  await db.insert(caseEvents).values({
    caseId,
    userId: supervisor.id,
    action: 'revision_requested',
    note: note.trim(),
  });

  return updatedCase;
}

/**
 * Standalone comment addition to audit trail
 */
export async function addCaseComment(caseId: number, user: User, note: string) {
  if (!note || note.trim().length === 0) {
    throw new ForbiddenError('Comment content cannot be empty');
  }

  await authorizeCaseAccess(user, caseId, 'read');

  await db.insert(caseEvents).values({
    caseId,
    userId: user.id,
    action: 'comment_added',
    note: note.trim(),
  });

  return { success: true };
}
