import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, type User, type UserRole } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

/**
 * Server-side helper for React Server Components / Layouts.
 * Reads Clerk session, verifies/syncs user in Postgres, checks active status.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  // 1. Try to find user in Postgres by Clerk ID
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (dbUser) {
    return dbUser;
  }

  // 2. Try to match by Clerk primary email if Admin pre-created account in Postgres
  try {
    const clerkUser = await clerkCurrentUser();
    if (!clerkUser) {
      return null;
    }

    const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress || null;
    const primaryPhone = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;
    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
      clerkUser.username ||
      'User';
    const username = clerkUser.username || clerkUser.id;

    if (primaryEmail) {
      const [userByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, primaryEmail))
        .limit(1);

      if (userByEmail) {
        // Link Clerk user ID to the pre-created Postgres user record
        const [updatedUser] = await db
          .update(users)
          .set({ id: userId, updatedAt: new Date() })
          .where(eq(users.id, userByEmail.id))
          .returning();

        return updatedUser;
      }
    }

    // Check if this is the very first user in the system -> initial Admin setup
    const [totalUsersResult] = await db.select({ value: count() }).from(users);
    const isFirstUser = (totalUsersResult?.value ?? 0) === 0;

    if (isFirstUser) {
      const [firstAdmin] = await db
        .insert(users)
        .values({
          id: userId,
          fullName,
          username,
          email: primaryEmail,
          phone: primaryPhone,
          role: 'admin',
          active: true,
        })
        .returning();

      return firstAdmin;
    }

    // If not first user and account was NOT created by Admin:
    // Create record with active = false (pending Admin activation)
    const [pendingUser] = await db
      .insert(users)
      .values({
        id: userId,
        fullName,
        username,
        email: primaryEmail,
        phone: primaryPhone,
        role: 'student',
        active: false, // Inactive until Admin marks account active!
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          fullName,
          email: primaryEmail,
          phone: primaryPhone,
          updatedAt: new Date(),
        },
      })
      .returning();

    return pendingUser;
  } catch (err) {
    console.error('Failed to resolve user from Clerk to Postgres:', err);
    return null;
  }
}

/**
 * Server Component guard: requires authenticated, active user with specified role(s).
 * Enforces rule: user can only access portal if account exists in DB and active = true.
 */
export async function requireUser(allowedRoles?: UserRole[]): Promise<User> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await getCurrentUser();

  if (!user || !user.active) {
    redirect('/account-disabled');
  }

  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    // Redirect to the user's appropriate portal based on their actual role
    switch (user.role) {
      case 'admin':
        redirect('/app/admin');
      case 'supervisor':
        redirect('/app/supervisor');
      case 'student':
        redirect('/app/student');
      default:
        redirect('/account-disabled');
    }
  }

  return user;
}

/**
 * API Route Handler guard: enforces authentication, active state, and role restrictions.
 * Returns { user } on success, or { errorResponse } on failure.
 */
export async function getAuthenticatedApiUser(allowedRoles?: UserRole[]): Promise<
  | { user: User; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const { userId } = await auth();
  if (!userId) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Account not found in database. Please contact an administrator.' },
        { status: 401 }
      ),
    };
  }

  if (!user.active) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Forbidden: Account is disabled or pending administrator activation.' },
        { status: 403 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Forbidden: Insufficient role permissions' },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}
