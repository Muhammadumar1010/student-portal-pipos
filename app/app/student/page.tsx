import { requireUser } from '@/lib/auth';
import { db } from '@/db';
import { cases } from '@/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import Link from 'next/link';
import { StatusBadge } from '@/components/statusBadge';
import {
  FolderKanban,
  FileCheck,
  AlertTriangle,
  Clock,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

export default async function StudentDashboardPage() {
  const user = await requireUser(['student']);

  // Compute metrics for student
  const [totalRes] = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.studentId, user.id));

  const [draftRes] = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.studentId, user.id));

  const [awaitingRes] = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.studentId, user.id));

  const [revisionRes] = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.studentId, user.id));

  const [approvedRes] = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.studentId, user.id));

  // Get counts by status
  const userCases = await db
    .select()
    .from(cases)
    .where(eq(cases.studentId, user.id))
    .orderBy(desc(cases.updatedAt));

  const totalCases = userCases.length;
  const inProgressCases = userCases.filter((c) => ['Draft', 'Assigned', 'In Progress'].includes(c.status)).length;
  const awaitingCases = userCases.filter((c) => c.status === 'Completed - Awaiting Approval').length;
  const revisionCases = userCases.filter((c) => c.status === 'Revision Required');
  const approvedCases = userCases.filter((c) => c.status === 'Approved').length;

  const recentCases = userCases.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-2">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-brand-page p-6 border border-brand-border-default shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
            Hello {user.fullName}
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Registration No: {user.registrationNo || 'N/A'}
          </p>
        </div>

        <Link
          href="/app/student/cases/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-accent/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          New Patient Case
        </Link>
      </div>

      {/* Revision Alerts */}
      {revisionCases.length > 0 && (
        <div className="rounded-xl border border-brand-danger-border bg-brand-danger-bg p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-brand-danger shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-brand-danger">
                Action Required: {revisionCases.length} case(s) returned for revision
              </h3>
              <p className="text-xs text-brand-danger mt-1">
                Your supervisor has provided clinical feedback that requires your attention before resubmission.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {revisionCases.map((rc) => (
                  <Link
                    key={rc.id}
                    href={`/app/cases/${rc.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-page px-3 py-1.5 text-xs font-semibold text-brand-danger border border-brand-danger-border hover:bg-brand-danger-bg/60 shadow-sm transition-colors"
                  >
                    {rc.caseNo || `Case #${rc.id}`}: {rc.patientName || rc.title}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
              Total Assigned Cases
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-text-primary">{totalCases}</p>
          <span className="text-xs text-brand-text-muted mt-1 block">Cumulative patient volume</span>
        </div>

        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
              In Progress / Draft
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-warning-bg text-brand-warning">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-warning">
            {inProgressCases}
          </p>
          <span className="text-xs text-brand-text-muted mt-1 block">Editable active records</span>
        </div>

        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
              Awaiting Approval
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-warning-bg text-brand-warning">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-warning">
            {awaitingCases}
          </p>
          <span className="text-xs text-brand-text-muted mt-1 block">Pending supervisor sign-off</span>
        </div>

        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
              Approved Cases
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-success-bg text-brand-success">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-success">
            {approvedCases}
          </p>
          <span className="text-xs text-brand-text-muted mt-1 block">Completed clinical records</span>
        </div>
      </div>

      {/* Recent Cases Table */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-brand-border-default">
          <div>
            <h2 className="text-base font-bold text-brand-text-primary">Recent Clinical Cases</h2>
            <p className="text-xs text-brand-text-muted mt-0.5">Your most recently updated patient cases</p>
          </div>
          <Link
            href="/app/student/cases"
            className="text-xs font-semibold text-brand-accent hover:opacity-80 transition-opacity"
          >
            View All Cases →
          </Link>
        </div>

        {recentCases.length === 0 ? (
          <div className="p-12 text-center text-sm text-brand-text-muted">
            No clinical cases found. Click <strong>New Patient Case</strong> above to create your first case.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-subtle text-brand-text-muted uppercase tracking-wider font-semibold border-b border-brand-border-default">
                <tr>
                  <th className="px-6 py-3.5">Case No</th>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-6 py-3.5">Diagnosis</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-default">
                {recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-subtle/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand-accent">
                      {c.caseNo || `#${c.id}`}
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-text-primary">
                      {c.patientName || 'Untitled Patient'}
                    </td>
                    <td className="px-6 py-4 text-brand-text-secondary max-w-xs truncate">
                      {c.diagnosis || 'Pending Diagnosis'}
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">
                      {c.caseCategory || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/cases/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-subtle px-2.5 py-1 font-semibold text-brand-text-secondary hover:bg-brand-accent/10 hover:text-brand-accent transition-colors"
                      >
                        Open Case <ArrowRight className="h-3 w-3" />
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
