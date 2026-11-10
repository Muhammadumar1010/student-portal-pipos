import { requireUser } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { AssignCaseForm } from './assignCaseForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AssignCasePage() {
  await requireUser(['supervisor']);

  const activeStudents = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      registrationNo: users.registrationNo,
      semester: users.semester,
      batchYear: users.batchYear,
    })
    .from(users)
    .where(and(eq(users.role, 'student'), eq(users.active, true)))
    .orderBy(users.fullName);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <Link
        href="/app/supervisor"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text-muted hover:text-brand-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Supervisor Portal
      </Link>

      <div className="rounded-xl border border-brand-border-default bg-brand-page p-6 sm:p-8 shadow-sm">
        <div className="border-b border-brand-border-default pb-4 mb-6">
          <h1 className="text-xl font-bold tracking-tight text-brand-text-primary">
            Assign Clinical Case to Student
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            Delegate a new clinical patient assignment to a registered P&O student.
          </p>
        </div>

        <AssignCaseForm students={activeStudents} />
      </div>
    </div>
  );
}
