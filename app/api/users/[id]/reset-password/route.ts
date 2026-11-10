import { NextResponse } from 'next/server';
import { getAuthenticatedApiUser } from '@/lib/auth';
import { getUserById } from '@/lib/data/users';
import { createClerkClient } from '@clerk/nextjs/server';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  const { errorResponse } = await getAuthenticatedApiUser(['admin']);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const user = await getUserById(id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    // Revoke current active sessions to require re-authentication
    const sessionList = await clerk.sessions.getSessionList({ userId: id });
    for (const s of sessionList.data) {
      await clerk.sessions.revokeSession(s.id);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset triggered for ${user.fullName}. All active sessions have been revoked.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to trigger password reset';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
