import { z } from 'zod';
import type { CaseStatus, UserRole } from '@/db/schema';

export const EDITABLE_STATUSES: CaseStatus[] = [
  'Draft',
  'Assigned',
  'In Progress',
  'Revision Required',
];

export function isCaseEditableByStudent(status: CaseStatus, studentId: string, currentUserId: string): boolean {
  return studentId === currentUserId && EDITABLE_STATUSES.includes(status);
}

/**
 * Valid transitions lookup table
 */
export const VALID_TRANSITIONS: Record<
  CaseStatus,
  { to: CaseStatus; allowedRoles: UserRole[]; requiresComment?: boolean }[]
> = {
  Draft: [
    { to: 'Completed - Awaiting Approval', allowedRoles: ['student'] },
  ],
  Assigned: [
    { to: 'Completed - Awaiting Approval', allowedRoles: ['student'] },
  ],
  'In Progress': [
    { to: 'Completed - Awaiting Approval', allowedRoles: ['student'] },
  ],
  'Completed - Awaiting Approval': [
    { to: 'Approved', allowedRoles: ['supervisor'] },
    { to: 'Revision Required', allowedRoles: ['supervisor'], requiresComment: true },
  ],
  'Revision Required': [
    { to: 'Completed - Awaiting Approval', allowedRoles: ['student'] },
  ],
  Approved: [],
};

/**
 * Validate if a status transition is permitted for a given role
 */
export function canTransitionStatus(
  currentStatus: CaseStatus,
  targetStatus: CaseStatus,
  role: UserRole
): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;

  const transition = allowed.find(
    (t) => t.to === targetStatus && t.allowedRoles.includes(role)
  );

  return !!transition;
}

/**
 * Mandatory fields required before a student can Mark Complete / Submit a case.
 */
export const caseCompletionSchema = z.object({
  // Tab 1: Patient Registration
  patientName: z.string().min(1, 'Patient Name is required'),
  patientGender: z.string().min(1, 'Patient Gender is required'),
  patientAge: z.string().min(1, 'Patient Age is required'),
  patientContact: z.string().min(1, 'Patient Contact is required'),

  // Tab 2: Clinical History
  caseCategory: z.string().min(1, 'Case Category is required'),
  deviceCategory: z.string().min(1, 'Device Category is required'),
  bodyRegion: z.string().min(1, 'Body Region is required'),
  affectedSide: z.string().min(1, 'Affected Side is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),

  // Tab 3: Assessment & Examination
  chiefComplaint: z.string().min(1, 'Chief Complaint is required'),
  clinicalFindings: z.string().min(1, 'Clinical Findings are required'),
  assessment: z.string().min(1, 'Assessment is required'),

  // Tab 4: Prescription & Treatment
  prescription: z.string().min(1, 'Prescription is required'),
  deviceType: z.string().min(1, 'Device Type is required'),

  // Tab 5: Outcome & Reflection
  outcome: z.string().min(1, 'Outcome is required'),
  studentReflection: z.string().min(1, 'Student Reflection is required'),
});

export type CaseCompletionData = z.infer<typeof caseCompletionSchema>;
