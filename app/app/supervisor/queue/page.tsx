import { requireUser } from '@/lib/auth';
import { db } from '@/db';
import { cases, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import { StatusBadge } from '@/components/statusBadge';
import { FileCheck, ArrowRight, Clock } from 'lucide-react';

export default async function SupervisorQueuePage() {
  const user = await requireUser(['supervisor']);

  const queueCases = await db
    .select({
      case: cases,
      studentName: users.fullName,
      studentRegNo: users.registrationNo,
    })
    .from(cases)
    .leftJoin(users, eq(cases.studentId, users.id))
    .where(
      and(
        eq(cases.supervisorId, user.id),
        eq(cases.status, 'Completed - Awaiting Approval')
      )
    )
    .orderBy(desc(cases.completedAt));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
              Approval Queue
            </h1>
            <span className="rounded-full bg-brand-warning-bg text-brand-warning border border-brand-warning-border text-xs font-bold px-2.5 py-0.5">
              {queueCases.length} Pending
            </span>
          </div>
          <p className="text-xs text-brand-text-muted mt-1">
            Clinical cases submitted by students awaiting your sign-off or return for revision.
          </p>
        </div>
      </div>

      {/* Queue List */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page shadow-sm overflow-hidden">
        {queueCases.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-success-bg text-brand-success border border-brand-success-border">
              <FileCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-brand-text-primary">
              All caught up!
            </h3>
            <p className="text-xs text-brand-text-muted max-w-sm mx-auto">
              There are no student cases currently pending your clinical review. Check back later when students mark cases complete.
            </p>
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
                  <th className="px-6 py-3.5">Device Type</th>
                  <th className="px-6 py-3.5">Submitted On</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-default">
                {queueCases.map(({ case: c, studentName, studentRegNo }) => (
                  <tr key={c.id} className="hover:bg-brand-subtle/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand-accent">
                      {c.caseNo || `#${c.id}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-text-primary">{studentName}</div>
                      <div className="text-[11px] text-brand-text-muted">Reg: {studentRegNo || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-text-primary">{c.patientName || 'Untitled'}</div>
                      <div className="text-[11px] text-brand-text-muted">
                        {c.patientGender || ''} {c.patientAge ? `(${c.patientAge})` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-brand-text-secondary max-w-xs truncate">
                      {c.diagnosis || '—'}
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">
                      {c.deviceType || c.deviceCategory || '—'}
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {c.completedAt ? new Date(c.completedAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/cases/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-accent px-3 py-1.5 font-semibold text-white hover:bg-brand-accent/90 shadow-sm transition-colors"
                      >
                        Review Case <ArrowRight className="h-3 w-3" />
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
