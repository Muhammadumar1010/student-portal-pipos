import { NextResponse } from 'next/server';
import { getAuthenticatedApiUser } from '@/lib/auth';
import { toggleUserStatus } from '@/lib/data/users';
import { createClerkClient } from '@clerk/nextjs/server';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { user: authUser, errorResponse } = await getAuthenticatedApiUser(['admin']);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const body = await req.json();
    const active = typeof body.active === 'boolean' ? body.active : true;

    if (authUser && authUser.id === id && !active) {
      return NextResponse.json(
        { error: 'You cannot disable your own active admin account.' },
        { status: 400 }
      );
    }

    const updated = await toggleUserStatus(id, active);

    // Sync active state to Clerk session publicMetadata
    try {
      await clerk.users.updateUserMetadata(id, {
        publicMetadata: {
          active,
        },
      });
    } catch (err) {
      console.warn('Failed to sync active state to Clerk:', err);
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update status';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
