import { requireUser } from '@/lib/auth';
import { db } from '@/db';
import { users, cases } from '@/db/schema';
import { inArray, eq, and, count, desc } from 'drizzle-orm';
import Link from 'next/link';
import { StatusBadge } from '@/components/statusBadge';
import {
  Users as UsersIcon,
  GraduationCap,
  FolderKanban,
  FileCheck,
  CheckCircle2,
  Database,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/Button';

export default async function AdminDashboardPage() {
  const user = await requireUser(['admin']);

  const roleCounts = await db
    .select({
      role: users.role,
      count: count()
    })
    .from(users)
    .where(
      and(
        inArray(users.role, ['student', 'supervisor']),
        eq(users.active, true)
      )
    )
    .groupBy(users.role);


  const [totalCasesCount] = await db.select({ count: count() }).from(cases);

  const [awaitingCount] = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.status, 'Completed - Awaiting Approval'));

  const [approvedCount] = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.status, 'Approved'));

  // Recent clinical cases
  const recentCases = await db
    .select({
      case: cases,
      studentName: users.fullName,
      studentRegNo: users.registrationNo,
    })
    .from(cases)
    .leftJoin(users, eq(cases.studentId, users.id))
    .orderBy(desc(cases.createdAt))
    .limit(5);

  return (
    <div className="w-full mx-auto space-y-4 pb-16 pt-4 px-24">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-brand-page p-6 border border-brand-border-default shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
            Admin Portal
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            PIPOS • System Administrator: <strong>{user.fullName}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/app/admin/users"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-accent/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" /> Manage Users
          </Link>
          <Link
            href="/app/admin/backup"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-default bg-brand-page px-3.5 py-2 text-xs font-semibold text-brand-text-secondary hover:bg-brand-subtle transition-colors shadow-sm"
          >
            <Database className="h-4 w-4" /> Export / Backup
          </Link>
        </div>
      </div>

      {/* 5 Core Stat Cards (PRD §16) */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Active Students</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-border-default bg-brand-subtle text-brand-text-secondary">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-text-primary">{roleCounts[0]?.count || 0}</p>
          <span className="text-[11px] text-brand-text-muted mt-1 block">Registered clinicians</span>
        </div>

        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Supervisors</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-border-default bg-brand-subtle text-brand-text-secondary">
              <UsersIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-text-primary">{roleCounts[1]?.count || 0}</p>
          <span className="text-[11px] text-brand-text-muted mt-1 block">Clinical faculty</span>
        </div>

        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Total Cases</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-border-default bg-brand-subtle text-brand-text-secondary">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-text-primary">{totalCasesCount?.count || 0}</p>
          <span className="text-[11px] text-brand-text-muted mt-1 block">All recorded clinical files</span>
        </div>

        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center gap-2 justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Approval Queue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-warning-bg text-brand-warning">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-warning">{awaitingCount?.count || 0}</p>
          <span className="text-[11px] text-brand-text-muted mt-1 block">Supervisor queue backlog</span>
        </div>

        <div className="rounded-xl border border-brand-border-default bg-brand-page p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Approved Cases</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-success-bg text-brand-success">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-brand-success">{approvedCount?.count || 0}</p>
          <span className="text-[11px] text-brand-text-muted mt-1 block">Officially closed & signed</span>
        </div>
      </div>

      {/* Recent Institutional Cases Table */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-brand-border-default">
          <div>
            <h2 className="text-base font-bold text-brand-text-primary">Recent Clinical Cases</h2>
            <p className="text-xs text-brand-text-muted mt-0.5">Institution-wide recent patient submissions</p>
          </div>
          <Button
            href="/app/admin/cases"
            label="Browse All Cases"
          />
        </div>

        {recentCases.length === 0 ? (
          <div className="p-12 text-center text-sm text-brand-text-muted">
            No clinical cases registered in the system yet.
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
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-default">
                {recentCases.map(({ case: c, studentName, studentRegNo }) => (
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
                      <div className="text-[11px] text-brand-text-muted">{c.patientCode ? `MR: ${c.patientCode}` : ''}</div>
                    </td>
                    <td className="px-6 py-4 text-brand-text-secondary max-w-xs truncate">
                      {c.diagnosis || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/cases/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-subtle px-3 py-1 font-semibold text-brand-text-secondary hover:bg-brand-accent/10 hover:text-brand-accent transition-colors"
                      >
                        Inspect Case <ArrowRight className="h-3 w-3" />
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
