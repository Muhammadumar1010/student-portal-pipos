import { requireUser } from '@/lib/auth';
import { db } from '@/db';
import { cases, users } from '@/db/schema';
import { eq, and, count, desc } from 'drizzle-orm';
import Link from 'next/link';
import { StatusBadge } from '@/components/statusBadge';
import {
  FileCheck,
  FolderKanban,
  Users,
  PlusCircle,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default async function SupervisorDashboardPage() {
  const user = await requireUser(['supervisor']);

  // Fetch supervised cases
  const supervisedCases = await db
    .select({
      case: cases,
      studentName: users.fullName,
      studentRegNo: users.registrationNo,
    })
    .from(cases)
    .leftJoin(users, eq(cases.studentId, users.id))
    .where(eq(cases.supervisorId, user.id))
    .orderBy(desc(cases.updatedAt));

  const totalSupervised = supervisedCases.length;
  const queueCases = supervisedCases.filter((c) => c.case.status === 'Completed - Awaiting Approval');
  const inProgressCases = supervisedCases.filter((c) => ['Draft', 'Assigned', 'In Progress'].includes(c.case.status)).length;
  const approvedCases = supervisedCases.filter((c) => c.case.status === 'Approved').length;

  // Distinct students supervised
  const studentIds = new Set(supervisedCases.map((c) => c.case.studentId));
  const activeStudentsCount = studentIds.size;

  return (
    <div className="max-w-7xl mx-auto space-y-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-brand-page p-6 border border-brand-border-default shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
            Dr. {user.fullName} - Supervisor
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Department of {user.department || 'Prosthetic & Orthotic Sciences'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/supervisor/cases/assign"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-accent/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Assign New Case
          </Link>
        </div>
      </div>

      {/* Approval Queue Urgent Alert */}
      {queueCases.length > 0 && (
        <div className="rounded-xl border border-brand-warning-border bg-gradient-to-r from-brand-warning-bg to-brand-subtle p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-warning text-white shadow">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  Approval Queue: {queueCases.length} case(s) awaiting your review
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Students have completed documentation and submitted for clinical sign-off.
                </p>
              </div>
            </div>

            <Link
              href="/app/supervisor/queue"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-xs font-bold text-white hover:bg-brand-accent/90 shadow-sm transition-colors"
            >
              Open Queue <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-warning-bg text-brand-warning">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-warning">{queueCases.length}</p>
          <span className="text-xs text-brand-text-muted mt-1 block">Awaiting clinical approval</span>
        </div>

        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
              Total Supervised
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-text-primary">{totalSupervised}</p>
          <span className="text-xs text-brand-text-muted mt-1 block">Lifetime cases assigned to you</span>
        </div>

        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
              Active In Progress
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-warning-bg text-brand-warning">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-warning">{inProgressCases}</p>
          <span className="text-xs text-brand-text-muted mt-1 block">Under active fabrication/fitting</span>
        </div>

        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
              Supervised Students
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-text-primary">{activeStudentsCount}</p>
          <span className="text-xs text-brand-text-muted mt-1 block">Students with active cases</span>
        </div>
      </div>

      {/* Approval Queue Table */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-brand-border-default">
          <div>
            <h2 className="text-base font-bold text-brand-text-primary">Cases Awaiting Approval</h2>
            <p className="text-xs text-brand-text-muted mt-0.5">Submitted by students for review and sign-off</p>
          </div>
          <Link
            href="/app/supervisor/queue"
            className="text-xs font-semibold text-brand-accent hover:opacity-80 transition-opacity"
          >
            Go to Approval Queue →
          </Link>
        </div>

        {queueCases.length === 0 ? (
          <div className="p-12 text-center text-sm text-brand-text-muted">
            No cases currently awaiting approval. Your queue is clear!
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
                  <th className="px-6 py-3.5">Submitted On</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-default">
                {queueCases.slice(0, 5).map(({ case: c, studentName, studentRegNo }) => (
                  <tr key={c.id} className="hover:bg-brand-subtle/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand-accent">
                      {c.caseNo || `#${c.id}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-text-primary">{studentName}</div>
                      <div className="text-[11px] text-brand-text-muted">{studentRegNo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-text-primary">{c.patientName || 'Untitled'}</div>
                      <div className="text-[11px] text-brand-text-muted">{c.patientGender || ''} {c.patientAge ? `(${c.patientAge})` : ''}</div>
                    </td>
                    <td className="px-6 py-4 text-brand-text-secondary max-w-xs truncate">
                      {c.diagnosis || '—'}
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">
                      {c.completedAt ? new Date(c.completedAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/cases/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-accent px-3 py-1 font-semibold text-white hover:bg-brand-accent/90 shadow-sm transition-colors"
                      >
                        Review & Approve <ArrowRight className="h-3 w-3" />
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
