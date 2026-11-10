import { NextResponse } from 'next/server';
import { getAuthenticatedApiUser } from '@/lib/auth';
import { getUserById, updateUser, deleteUser, ConflictError } from '@/lib/data/users';
import { createClerkClient } from '@clerk/nextjs/server';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  const { errorResponse } = await getAuthenticatedApiUser(['admin']);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const user = await getUserById(id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { user: authUser, errorResponse } = await getAuthenticatedApiUser(['admin']);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const body = await req.json();

    if (authUser && authUser.id === id && body.active === false) {
      return NextResponse.json(
        { error: 'You cannot disable your own active admin account.' },
        { status: 400 }
      );
    }

    const updated = await updateUser(id, body);

    // Sync role and active mirror to Clerk publicMetadata
    const metadataToUpdate: Record<string, unknown> = {};
    if (body.role) metadataToUpdate.role = body.role;
    if (typeof body.active === 'boolean') metadataToUpdate.active = body.active;

    if (Object.keys(metadataToUpdate).length > 0) {
      try {
        await clerk.users.updateUserMetadata(id, {
          publicMetadata: metadataToUpdate,
        });
      } catch (err) {
        console.warn('Failed to sync metadata to Clerk:', err);
      }
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update user';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const { user: authUser, errorResponse } = await getAuthenticatedApiUser(['admin']);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (authUser && authUser.id === id) {
    return NextResponse.json(
      { error: 'You cannot delete your own active admin account.' },
      { status: 400 }
    );
  }

  try {
    await deleteUser(id);

    // Delete in Clerk as well
    try {
      await clerk.users.deleteUser(id);
    } catch (err) {
      console.warn('Clerk user delete warning:', err);
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : 'Failed to delete user';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
