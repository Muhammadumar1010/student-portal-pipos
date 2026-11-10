import { requireUser } from '@/lib/auth';
import { getCaseDetailsForUser, getCaseEventsForUser } from '@/lib/data/cases';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/statusBadge';
import { CaseEditor } from '@/components/cases/caseEditor';
import { AuditTimeline } from '@/components/cases/auditTimeline';
import { SupervisorReviewPanel } from '@/components/cases/supervisorReviewPanel';
import Link from 'next/link';
import { Printer, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Button from '@/components/Button';

interface CasePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CasePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Case #${id} | CaseFlow PIPOS`,
  };
}

export default async function CaseDetailPage({ params }: CasePageProps) {
  const user = await requireUser();
  const { id } = await params;
  const caseId = parseInt(id, 10);
  if (isNaN(caseId)) notFound();

  let caseDetails;
  let events;
  try {
    caseDetails = await getCaseDetailsForUser(caseId, user);
    events = await getCaseEventsForUser(caseId, user);
  } catch {
    notFound();
  }

  const { case: caseData, student, supervisor } = caseDetails;
  const isSupervisorOfCase = user.role === 'supervisor' && caseData.supervisorId === user.id;
  const isStudentOwner = user.role === 'student' && caseData.studentId === user.id;
  const canPrintReport = caseData.status === 'Completed - Awaiting Approval' || caseData.status === 'Approved';

  const backUrl =
    user.role === 'admin'
      ? '/app/admin/cases'
      : user.role === 'supervisor'
        ? '/app/supervisor/cases'
        : '/app/student/cases';

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-16 pt-4">
      {/* Top breadcrumb & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          href={backUrl}
          label="Back"
          arrow="left"
        />

        <div className="flex items-center gap-3">
          {canPrintReport && (
            <Link
              href={`/app/cases/${caseId}/report`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-default bg-brand-page px-3 py-1.5 text-xs font-semibold text-brand-text-secondary hover:bg-brand-subtle shadow-sm transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-brand-text-muted" />
              Print / Preview Clinical Report
            </Link>
          )}
        </div>
      </div>

      {/* Case Header Card */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-brand-accent">
                {caseData.caseNo || `CASE #${caseData.id}`}
              </span>
              <StatusBadge status={caseData.status} />
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-text-primary">
              {caseData.title || caseData.patientName || 'Untitled Clinical Case'}
            </h1>
            <p className="text-xs text-brand-text-muted mt-1">
              Assigned: {caseData.dateAssigned || 'N/A'} • Due: {caseData.dueDate || 'N/A'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 text-xs border-t pt-4 md:border-t-0 md:pt-0 border-brand-border-default">
            <div className="rounded-lg bg-brand-subtle p-3">
              <span className="text-brand-text-muted block uppercase tracking-wider text-[10px] font-bold">
                Student Clinician
              </span>
              <span className="font-semibold text-brand-text-primary">
                {student?.fullName || 'N/A'}
              </span>
              {student?.registrationNo && (
                <span className="text-brand-text-muted block">Reg: {student.registrationNo}</span>
              )}
            </div>

            <div className="rounded-lg bg-brand-subtle p-3">
              <span className="text-brand-text-muted block uppercase tracking-wider text-[10px] font-bold">
                Assigned Supervisor
              </span>
              <span className="font-semibold text-brand-text-primary">
                {supervisor?.fullName || 'N/A'}
              </span>
              {supervisor?.designation && (
                <span className="text-brand-text-muted block">{supervisor.designation}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supervisor Review Action Panel */}
      {isSupervisorOfCase && (
        <SupervisorReviewPanel caseId={caseId} currentStatus={caseData.status} />
      )}

      {/* Tabbed Clinical Case Form */}
      <CaseEditor
        caseData={caseData}
        currentUserId={user.id}
        isStudentOwner={isStudentOwner}
      />

      {/* Audit History Timeline */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page p-6 sm:p-8 shadow-sm">
        <h3 className="text-base font-semibold text-brand-text-primary mb-6 border-b border-brand-border-default pb-3">
          Case Event Audit Trail (Read-Only)
        </h3>
        <AuditTimeline events={events} />
      </div>
    </div>
  );
}
