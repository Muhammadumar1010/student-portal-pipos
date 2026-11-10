import { requireUser } from '@/lib/auth';
import { listUsers } from '@/lib/data/users';
import { UserManager } from './userManager';
import Button from '@/components/Button';

export default async function AdminUsersPage() {
  const user = await requireUser(['admin']);
  const initialData = await listUsers({ limit: 100 });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 pt-6">
      <div className='flex flex-col gap-4'>
        <Button href="/app/admin" label="Back" arrow="left" />
        <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
          Users & Account Management
        </h1>
        <p className="text-xs text-brand-text-muted mt-1">
          Manage clinical faculty, students, and administrators with role-based access control.
        </p>
      </div>

      <UserManager initialUsers={initialData.users} currentUserId={user.id} />
    </div>
  );
}
