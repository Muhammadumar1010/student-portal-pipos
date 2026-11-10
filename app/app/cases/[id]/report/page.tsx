import { requireUser } from '@/lib/auth';
import { getCaseDetailsForUser } from '@/lib/data/cases';
import { notFound, redirect } from 'next/navigation';
import { PrintButton } from './printButton';
import type { Metadata } from 'next';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Clinical Report - Case #${id} | PIPOS`,
  };
}

export default async function CaseReportPage({ params }: ReportPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const caseId = parseInt(id, 10);
  if (isNaN(caseId)) notFound();

  let caseDetails;
  try {
    caseDetails = await getCaseDetailsForUser(caseId, user);
  } catch {
    notFound();
  }

  const { case: caseData, student, supervisor } = caseDetails;

  // PRD §29/§687: Reports only allowed for Completed - Awaiting Approval or Approved
  const isAllowedStatus =
    caseData.status === 'Completed - Awaiting Approval' || caseData.status === 'Approved';

  if (!isAllowedStatus) {
    redirect(`/app/cases/${caseId}`);
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 print:p-0 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      {/* Top action bar (hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <a
          href={`/app/cases/${caseId}`}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Return to Case Detail
        </a>
        <PrintButton />
      </div>

      {/* Official Clinical Report Paper */}
      <article className="max-w-4xl mx-auto bg-white p-8 sm:p-12 border border-slate-200 shadow-md rounded-xl print:border-none print:shadow-none print:p-6 print:max-w-none text-slate-900">
        {/* Header */}
        <header className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <h1 className="text-xl font-bold uppercase tracking-wide">
            Pakistan Institute of Prosthetic & Orthotic Sciences (PIPOS)
          </h1>
          <p className="text-sm font-medium text-slate-700">
            Department of Prosthetic & Orthotic Sciences • Clinical Training Division
          </p>
          <div className="mt-2 inline-block rounded bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 border border-slate-300">
            Official Clinical Case Record & Assessment Report
          </div>
        </header>

        {/* Case Meta Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded bg-slate-50 border border-slate-200 text-xs mb-6">
          <div>
            <span className="text-slate-500 block font-semibold">Case Number:</span>
            <span className="font-mono font-bold text-sm text-indigo-900">{caseData.caseNo || `CASE #${caseData.id}`}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">Current Status:</span>
            <span className="font-bold">{caseData.status}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">Date Assigned:</span>
            <span>{caseData.dateAssigned || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">Approved Date:</span>
            <span>{caseData.approvedAt ? new Date(caseData.approvedAt).toLocaleDateString() : 'Pending'}</span>
          </div>
        </div>

        {/* 1. Patient Demographics */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-200 px-3 py-1 text-slate-900 mb-3">
            1. Patient Demographics & Registration
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs">
            <div><span className="text-slate-500">Patient Name:</span> <strong>{caseData.patientName || 'N/A'}</strong></div>
            <div><span className="text-slate-500">MR Code:</span> {caseData.patientCode || 'N/A'}</div>
            <div><span className="text-slate-500">Father/Guardian:</span> {caseData.fatherGuardianName || 'N/A'}</div>
            <div><span className="text-slate-500">Age / Gender:</span> {caseData.patientAge || 'N/A'} • {caseData.patientGender || 'N/A'}</div>
            <div><span className="text-slate-500">Contact:</span> {caseData.patientContact || 'N/A'}</div>
            <div><span className="text-slate-500">CNIC:</span> {caseData.patientCnic || 'N/A'}</div>
            <div><span className="text-slate-500">Occupation:</span> {caseData.occupation || 'N/A'}</div>
            <div><span className="text-slate-500">Referral:</span> {caseData.referralSource || 'N/A'}</div>
            <div className="col-span-2 sm:col-span-3"><span className="text-slate-500">Address:</span> {caseData.patientAddress || 'N/A'}</div>
          </div>
        </section>

        {/* 2. Clinical History */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-200 px-3 py-1 text-slate-900 mb-3">
            2. Clinical History & Diagnosis
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs">
            <div><span className="text-slate-500">Case Category:</span> {caseData.caseCategory || 'N/A'}</div>
            <div><span className="text-slate-500">Device Category:</span> {caseData.deviceCategory || 'N/A'}</div>
            <div><span className="text-slate-500">Body Region / Side:</span> {caseData.bodyRegion || 'N/A'} ({caseData.affectedSide || 'N/A'})</div>
            <div><span className="text-slate-500">Etiology:</span> {caseData.etiology || 'N/A'}</div>
            <div><span className="text-slate-500">Date of Onset:</span> {caseData.dateOfOnset || 'N/A'}</div>
            <div className="col-span-2 sm:col-span-3">
              <span className="text-slate-500 block">Primary Diagnosis:</span>
              <p className="font-semibold mt-0.5">{caseData.diagnosis || 'N/A'}</p>
            </div>
            {caseData.medicalHistory && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-500 block">Medical History & Comorbidities:</span>
                <p className="mt-0.5">{caseData.medicalHistory}</p>
              </div>
            )}
          </div>
        </section>

        {/* 3. Assessment & Examination */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-200 px-3 py-1 text-slate-900 mb-3">
            3. Physical Examination & Functional Assessment
          </h2>
          <div className="space-y-2 text-xs">
            <div><span className="text-slate-500 font-semibold">Chief Complaint:</span> {caseData.chiefComplaint || 'N/A'}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-500">Pain Assessment:</span> {caseData.painAssessment || 'N/A'}</div>
              <div><span className="text-slate-500">Skin Condition:</span> {caseData.skinCondition || 'N/A'}</div>
              <div><span className="text-slate-500">Range of Motion:</span> {caseData.romFindings || 'N/A'}</div>
              <div><span className="text-slate-500">Muscle Power:</span> {caseData.musclePower || 'N/A'}</div>
            </div>
            <div><span className="text-slate-500 font-semibold block">Clinical Findings:</span> {caseData.clinicalFindings || 'N/A'}</div>
            <div><span className="text-slate-500 font-semibold block">Assessment Summary:</span> {caseData.assessment || 'N/A'}</div>
            {caseData.measurements && <div><span className="text-slate-500 font-semibold block">Measurements:</span> {caseData.measurements}</div>}
          </div>
        </section>

        {/* 4. Prescription & Fabrication */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-200 px-3 py-1 text-slate-900 mb-3">
            4. Prescription, Fabrication & Alignment
          </h2>
          <div className="space-y-2 text-xs">
            <div><span className="text-slate-500 font-semibold">Device Type:</span> <strong>{caseData.deviceType || 'N/A'}</strong></div>
            <div><span className="text-slate-500 font-semibold block">Prescription:</span> {caseData.prescription || 'N/A'}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-500">Component Selection:</span> {caseData.componentSelection || 'N/A'}</div>
              <div><span className="text-slate-500">Fitting & Alignment:</span> {caseData.fittingAlignment || 'N/A'}</div>
            </div>
            {caseData.materialsUsed && <div><span className="text-slate-500">Materials:</span> {caseData.materialsUsed}</div>}
          </div>
        </section>

        {/* 5. Outcome & Reflection */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-200 px-3 py-1 text-slate-900 mb-3">
            5. Clinical Outcome & Student Reflection
          </h2>
          <div className="space-y-2 text-xs">
            <div><span className="text-slate-500 font-semibold block">Outcome Evaluation:</span> {caseData.outcome || 'N/A'}</div>
            <div><span className="text-slate-500 font-semibold block">Student Reflection:</span> {caseData.studentReflection || 'N/A'}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-500">Follow-up Plan:</span> {caseData.followUpPlan || 'N/A'}</div>
              <div><span className="text-slate-500">Next Scheduled Visit:</span> {caseData.nextVisitDate || 'N/A'}</div>
            </div>
          </div>
        </section>

        {/* Supervisor Comments */}
        {caseData.supervisorComments && (
          <section className="mb-8 p-3 rounded border border-slate-300 bg-slate-50 text-xs">
            <span className="font-bold text-slate-900 block mb-1">Supervisor Clinical Review & Remarks:</span>
            <p className="italic text-slate-700">{caseData.supervisorComments}</p>
          </section>
        )}

        {/* Signatures */}
        <footer className="mt-12 pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-12 text-xs">
          <div>
            <p className="font-bold text-slate-900 uppercase">Student Clinician</p>
            <div className="mt-8 border-b border-slate-400 w-48"></div>
            <p className="mt-1 font-semibold">{student?.fullName}</p>
            <p className="text-slate-500">Registration: {student?.registrationNo || 'N/A'}</p>
            <p className="text-slate-400 text-[10px] mt-0.5">Date: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="text-right">
            <p className="font-bold text-slate-900 uppercase">Clinical Supervisor</p>
            <div className="mt-8 border-b border-slate-400 w-48 ml-auto"></div>
            <p className="mt-1 font-semibold">{supervisor?.fullName}</p>
            <p className="text-slate-500">{supervisor?.designation || 'Supervisor'}</p>
            <p className="text-slate-400 text-[10px] mt-0.5">
              Approved Date: {caseData.approvedAt ? new Date(caseData.approvedAt).toLocaleDateString() : '______________'}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
