import { requireUser } from '@/lib/auth';
import { listActiveSupervisors } from '@/lib/data/users';
import { CreateCaseForm } from './createCaseForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewPatientCasePage() {
  await requireUser(['student']);
  const supervisors = await listActiveSupervisors();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <Link
        href="/app/student"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text-muted hover:text-brand-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Student Portal
      </Link>

      <div className="rounded-xl border border-brand-border-default bg-brand-page p-6 sm:p-8 shadow-sm">
        <div className="border-b border-brand-border-default pb-4 mb-6">
          <h1 className="text-xl font-bold tracking-tight text-brand-text-primary">
            Register New Clinical Patient Case
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            Initiate a clinical documentation shell. You will be redirected immediately to the comprehensive 5-stage case form.
          </p>
        </div>

        <CreateCaseForm supervisors={supervisors} />
      </div>
    </div>
  );
}
