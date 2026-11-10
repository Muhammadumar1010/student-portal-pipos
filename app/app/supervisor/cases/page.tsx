import { requireUser } from '@/lib/auth';
import { listCasesForUser } from '@/lib/data/cases';
import { StatusBadge } from '@/components/statusBadge';
import Link from 'next/link';
import { Search, ArrowRight, PlusCircle } from 'lucide-react';
import type { CaseStatus } from '@/db/schema';

interface SupervisorCasesPageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

export default async function SupervisorCasesPage({ searchParams }: SupervisorCasesPageProps) {
  const user = await requireUser(['supervisor']);
  const { search, status } = await searchParams;

  const result = await listCasesForUser(user, {
    search,
    status: status as CaseStatus,
  });

  const statuses = [
    'All',
    'Draft',
    'Assigned',
    'In Progress',
    'Completed - Awaiting Approval',
    'Revision Required',
    'Approved',
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
            My Supervised Clinical Cases
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            Total of {result.totalCount} cases assigned to you for supervision across all clinical stages.
          </p>
        </div>

        <Link
          href="/app/supervisor/cases/assign"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-accent/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Assign New Case
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page p-4 shadow-sm space-y-3">
        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-text-muted" />
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Search by patient, student name, or case number..."
              className="w-full rounded-lg border border-brand-border-default bg-brand-page pl-9 pr-3 py-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={status || ''}
              className="rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-xs text-brand-text-primary focus:border-brand-accent focus:outline-none"
            >
              <option value="">All Statuses</option>
              {statuses.filter((s) => s !== 'All').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-brand-text-primary px-4 py-2 text-xs font-semibold text-brand-page hover:bg-brand-text-primary/90 transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Cases Table */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page shadow-sm overflow-hidden">
        {result.cases.length === 0 ? (
          <div className="p-16 text-center text-sm text-brand-text-muted">
            No clinical cases matched your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-subtle text-brand-text-muted uppercase tracking-wider font-semibold border-b border-brand-border-default">
                <tr>
                  <th className="px-6 py-3.5">Case No</th>
                  <th className="px-6 py-3.5">Student Clinician</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Diagnosis</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Dates</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-default">
                {result.cases.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-subtle/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand-accent">
                      {c.caseNo || `#${c.id}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-text-primary">{c.studentName}</div>
                      <div className="text-[11px] text-brand-text-muted">{c.studentRegNo || 'Reg: N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-text-primary">{c.patientName || 'Untitled'}</div>
                      <div className="text-[11px] text-brand-text-muted">{c.patientCode ? `MR: ${c.patientCode}` : ''}</div>
                    </td>
                    <td className="px-6 py-4 text-brand-text-secondary max-w-xs truncate">
                      {c.diagnosis || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">
                      <div>Assigned: {c.dateAssigned || 'N/A'}</div>
                      <div>Due: {c.dueDate || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/cases/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-subtle px-3 py-1 font-semibold text-brand-text-secondary hover:bg-brand-accent/10 hover:text-brand-accent transition-colors"
                      >
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
