import { requireUser } from '@/lib/auth';
import { listStudentsWithMetrics } from '@/lib/data/users';
import Link from 'next/link';
import { Users, GraduationCap, PlusCircle, FolderKanban } from 'lucide-react';

export default async function SupervisorStudentsPage() {
  const user = await requireUser(['supervisor']);
  const students = await listStudentsWithMetrics(user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
            Active Students Directory
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            Registered P&O students, active clinical case loads, and supervision status.
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

      <div className="rounded-xl border border-brand-border-default bg-brand-page shadow-sm overflow-hidden">
        {students.length === 0 ? (
          <div className="p-16 text-center text-sm text-brand-text-muted">
            No active students found in the department.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-subtle text-brand-text-muted uppercase tracking-wider font-semibold border-b border-brand-border-default">
                <tr>
                  <th className="px-6 py-3.5">Student Clinician</th>
                  <th className="px-6 py-3.5">Registration No</th>
                  <th className="px-6 py-3.5">Academic Progress</th>
                  <th className="px-6 py-3.5 text-center">Cases Under You</th>
                  <th className="px-6 py-3.5 text-center">Awaiting Approval</th>
                  <th className="px-6 py-3.5 text-center">Approved Cases</th>
                  <th className="px-6 py-3.5 text-center">Total Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-default">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-brand-subtle/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent font-bold text-xs">
                          {st.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-brand-text-primary">{st.fullName}</div>
                          <div className="text-[11px] text-brand-text-muted">{st.email || 'No email registered'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-brand-text-secondary">
                      {st.registrationNo || '—'}
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">
                      {st.semester ? `Semester ${st.semester}` : ''} {st.batchYear ? `• Batch ${st.batchYear}` : ''}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-brand-accent/10 text-brand-accent">
                        {st.underCurrentSupervisor}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-brand-warning-bg text-brand-warning">
                        {st.awaitingCases}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-brand-success-bg text-brand-success">
                        {st.approvedCases}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-brand-text-primary">
                      {st.totalCases}
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
