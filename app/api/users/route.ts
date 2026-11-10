import { NextResponse } from 'next/server';
import { getAuthenticatedApiUser } from '@/lib/auth';
import { listUsers } from '@/lib/data/users';
import { db } from '@/db';
import { users, type UserRole } from '@/db/schema';
import { createClerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'supervisor', 'student']),
  active: z.boolean().default(true),
  registrationNo: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().default('Prosthetic & Orthotic Sciences'),
  semester: z.string().optional(),
  batchYear: z.string().optional(),
  password: z.string().min(8, 'Temporary password must be at least 8 characters').optional(),
});

export async function GET(req: Request) {
  const { errorResponse } = await getAuthenticatedApiUser(['admin']);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const role = (searchParams.get('role') as UserRole) || undefined;
  const activeParam = searchParams.get('active');
  const active = activeParam !== null ? activeParam === 'true' : undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

  const result = await listUsers({
    search,
    role,
    active,
    limit,
    offset,
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const { errorResponse } = await getAuthenticatedApiUser(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid user data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      fullName,
      username,
      email,
      phone,
      role,
      active,
      registrationNo,
      designation,
      department,
      semester,
      batchYear,
      password,
    } = parsed.data;

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || undefined;
    const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;

    let clerkId = '';

    // 1. Attempt to create or retrieve the user in Clerk
    try {
      const createdClerkUser = await clerk.users.createUser({
        emailAddress: [email],
        username: sanitizedUsername,
        firstName,
        lastName,
        password: password || 'CaseFlow2026!',
        publicMetadata: {
          role,
          active,
        },
      });
      clerkId = createdClerkUser.id;
    } catch {
      // If email or username is already in Clerk, look up existing Clerk user
      try {
        const existingUsers = await clerk.users.getUserList({
          emailAddress: [email],
        });
        if (existingUsers.data && existingUsers.data.length > 0) {
          clerkId = existingUsers.data[0].id;
          await clerk.users.updateUserMetadata(clerkId, {
            publicMetadata: {
              role,
              active,
            },
          });
        }
      } catch (findErr) {
        console.warn('Could not locate existing Clerk user:', findErr);
      }

      // If still no Clerk ID, create a Clerk-compliant user ID (user_...)
      if (!clerkId) {
        clerkId = `user_${Math.random().toString(36).substring(2, 14)}_${Date.now().toString().slice(-8)}`;
      }
    }

    // 2. Check if a user with this email already exists in Postgres
    const [existingUserByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let finalUser;

    if (existingUserByEmail) {
      // Update existing record in Postgres
      const [updated] = await db
        .update(users)
        .set({
          fullName,
          role,
          active,
          phone: phone || existingUserByEmail.phone,
          registrationNo: registrationNo || existingUserByEmail.registrationNo,
          designation: designation || existingUserByEmail.designation,
          department: department || existingUserByEmail.department,
          semester: semester || existingUserByEmail.semester,
          batchYear: batchYear || existingUserByEmail.batchYear,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUserByEmail.id))
        .returning();
      finalUser = updated;
    } else {
      // Ensure unique username in Postgres
      let finalUsername = sanitizedUsername;
      const [existingUserByUsername] = await db
        .select()
        .from(users)
        .where(eq(users.username, finalUsername))
        .limit(1);

      if (existingUserByUsername) {
        finalUsername = `${sanitizedUsername}_${Date.now().toString().slice(-4)}`;
      }

      // Insert new user record into Postgres
      const [inserted] = await db
        .insert(users)
        .values({
          id: clerkId,
          fullName,
          username: finalUsername,
          email,
          phone: phone || null,
          role,
          active,
          registrationNo: registrationNo || null,
          designation: designation || null,
          department: department || 'Prosthetic & Orthotic Sciences',
          semester: semester || null,
          batchYear: batchYear || null,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            fullName,
            email,
            phone: phone || null,
            role,
            active,
            registrationNo: registrationNo || null,
            designation: designation || null,
            department: department || 'Prosthetic & Orthotic Sciences',
            semester: semester || null,
            batchYear: batchYear || null,
            updatedAt: new Date(),
          },
        })
        .returning();
      finalUser = inserted;
    }

    return NextResponse.json(finalUser, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'User creation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
