'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

interface StudentItem {
  id: string;
  fullName: string;
  registrationNo?: string | null;
  semester?: string | null;
}

export function AssignCaseForm({ students }: { students: StudentItem[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientCode, setPatientCode] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setError('Please select a student');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          title: title || (patientName ? `Assigned Case: ${patientName}` : 'Assigned Clinical Case'),
          dueDate: dueDate || undefined,
          patientName,
          patientCode,
          diagnosis,
          assignmentNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign case');

      router.push(`/app/cases/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-brand-danger-bg p-3 text-sm text-brand-danger border border-brand-danger-border">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
          Assign to Student Clinician <span className="text-brand-danger">*</span>
        </label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
          className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2.5 text-sm text-brand-text-primary focus:border-brand-accent focus:outline-none"
        >
          <option value="">Select student</option>
          {students.map((st) => (
            <option key={st.id} value={st.id}>
              {st.fullName} {st.registrationNo ? `(Reg: ${st.registrationNo})` : ''} {st.semester ? `[Sem ${st.semester}]` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Case Title / Assignment Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Transfemoral Prosthesis Fitting Case"
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Patient Name (Optional initial data)
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Ahmed Khan"
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Patient MR / Hospital Code
          </label>
          <input
            type="text"
            value={patientCode}
            onChange={(e) => setPatientCode(e.target.value)}
            placeholder="e.g. PIPOS-2026-092"
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Preliminary Diagnosis
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Left Knee Disarticulation"
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Submission Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary focus:border-brand-accent focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Instructions / Supervisor Notes for Student
          </label>
          <textarea
            rows={3}
            value={assignmentNote}
            onChange={(e) => setAssignmentNote(e.target.value)}
            placeholder="Specific clinical objectives, required examinations, or special patient conditions..."
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-brand-border-default">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent/90 disabled:opacity-50 transition-all shadow-sm"
        >
          {loading ? 'Assigning...' : 'Assign Case to Student'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
