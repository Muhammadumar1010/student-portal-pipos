import { db } from '@/db';
import { users, cases, type User, type UserRole } from '@/db/schema';
import { eq, and, or, ilike, desc, count } from 'drizzle-orm';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export interface UserFilterOptions {
  search?: string;
  role?: UserRole;
  active?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * List all users with search and filters (Admin only)
 */
export async function listUsers(options: UserFilterOptions = {}) {
  const { search, role, active, limit = 50, offset = 0 } = options;

  const conditions = [];
  if (role) conditions.push(eq(users.role, role));
  if (active !== undefined) conditions.push(eq(users.active, active));

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(users.fullName, searchPattern),
        ilike(users.username, searchPattern),
        ilike(users.email, searchPattern),
        ilike(users.registrationNo, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalCountResult] = await db
    .select({ count: count() })
    .from(users)
    .where(whereClause);

  return {
    users: results,
    totalCount: totalCountResult?.count || 0,
  };
}

/**
 * Get user by Clerk ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result || null;
}

/**
 * Update user editable profile fields (Admin only)
 */
export async function updateUser(
  id: string,
  data: {
    fullName?: string;
    phone?: string;
    registrationNo?: string;
    designation?: string;
    department?: string;
    semester?: string;
    batchYear?: string;
    role?: UserRole;
    active?: boolean;
  }
) {
  const [updatedUser] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return updatedUser;
}

/**
 * Toggle user active status (Admin only)
 */
export async function toggleUserStatus(id: string, active: boolean) {
  const [updatedUser] = await db
    .update(users)
    .set({
      active,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return updatedUser;
}

/**
 * Delete user (Admin only) - protected: cannot delete if linked to any cases
 */
export async function deleteUser(id: string) {
  // Check if user is referenced in any cases
  const [studentCaseCount] = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.studentId, id));

  const [supervisorCaseCount] = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.supervisorId, id));

  const [creatorCaseCount] = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.createdBy, id));

  const totalLinkedCases =
    (studentCaseCount?.count || 0) +
    (supervisorCaseCount?.count || 0) +
    (creatorCaseCount?.count || 0);

  if (totalLinkedCases > 0) {
    throw new ConflictError(
      `Cannot delete user: account is associated with ${totalLinkedCases} clinical case records. Deactivate the user instead.`
    );
  }

  await db.delete(users).where(eq(users.id, id));
  return { success: true };
}

/**
 * List active supervisors for case creation picker
 */
export async function listActiveSupervisors() {
  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      designation: users.designation,
      department: users.department,
    })
    .from(users)
    .where(and(eq(users.role, 'supervisor'), eq(users.active, true)))
    .orderBy(users.fullName);
}

/**
 * List active students with computed clinical case metrics (for supervisors)
 */
export async function listStudentsWithMetrics(currentSupervisorId?: string) {
  const students = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      registrationNo: users.registrationNo,
      semester: users.semester,
      batchYear: users.batchYear,
      email: users.email,
      active: users.active,
    })
    .from(users)
    .where(and(eq(users.role, 'student'), eq(users.active, true)))
    .orderBy(users.fullName);

  // Compute metrics for each student
  const studentMetrics = await Promise.all(
    students.map(async (student) => {
      const [totalResult] = await db
        .select({ count: count() })
        .from(cases)
        .where(eq(cases.studentId, student.id));

      const [awaitingResult] = await db
        .select({ count: count() })
        .from(cases)
        .where(
          and(
            eq(cases.studentId, student.id),
            eq(cases.status, 'Completed - Awaiting Approval')
          )
        );

      const [approvedResult] = await db
        .select({ count: count() })
        .from(cases)
        .where(and(eq(cases.studentId, student.id), eq(cases.status, 'Approved')));

      let underCurrentSupervisor = 0;
      if (currentSupervisorId) {
        const [underCurrentResult] = await db
          .select({ count: count() })
          .from(cases)
          .where(
            and(
              eq(cases.studentId, student.id),
              eq(cases.supervisorId, currentSupervisorId)
            )
          );
        underCurrentSupervisor = underCurrentResult?.count || 0;
      }

      return {
        ...student,
        totalCases: totalResult?.count || 0,
        awaitingCases: awaitingResult?.count || 0,
        approvedCases: approvedResult?.count || 0,
        underCurrentSupervisor,
      };
    })
  );

  return studentMetrics;
}
