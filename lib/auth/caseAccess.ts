import { db } from '@/db';
import { cases, type Case, type User, type CaseStatus } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { isCaseEditableByStudent } from '@/lib/caseStateMachine';

export class NotFoundError extends Error {
  constructor(message = 'Case not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access forbidden for current case status or role') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Core security function: Authorize and retrieve a case.
 * Enforces ownership predicates:
 * - Admin: full read access
 * - Supervisor: where supervisor_id = user.id
 * - Student: where student_id = user.id
 *
 * UN-AUTHORIZED ACCESS ALWAYS THROWS NotFoundError (returns 404),
 * preventing ID enumeration attacks.
 */
export async function authorizeCaseAccess(
  user: User,
  caseId: number,
  requiredAccess: 'read' | 'write' = 'read'
): Promise<Case> {
  let caseRecord: Case | undefined;

  if (user.role === 'admin') {
    const [result] = await db
      .select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1);
    caseRecord = result;
  } else if (user.role === 'supervisor') {
    const [result] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.supervisorId, user.id)))
      .limit(1);
    caseRecord = result;
  } else if (user.role === 'student') {
    const [result] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.studentId, user.id)))
      .limit(1);
    caseRecord = result;
  }

  // Not found or not owned by user -> 404
  if (!caseRecord) {
    throw new NotFoundError();
  }

  // If write access requested, check status permissions
  if (requiredAccess === 'write') {
    if (user.role !== 'student') {
      throw new ForbiddenError('Only students can edit clinical case contents');
    }

    if (!isCaseEditableByStudent(caseRecord.status as CaseStatus, caseRecord.studentId, user.id)) {
      throw new ForbiddenError(
        `Case in status '${caseRecord.status}' cannot be edited.`
      );
    }
  }

  return caseRecord;
}
