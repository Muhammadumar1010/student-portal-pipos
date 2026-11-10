'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

interface SupervisorItem {
  id: string;
  fullName: string;
  designation?: string | null;
  department?: string | null;
}

export function CreateCaseForm({ supervisors }: { supervisors: SupervisorItem[] }) {
  const router = useRouter();
  const [supervisorId, setSupervisorId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientCode, setPatientCode] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [patientContact, setPatientContact] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorId) {
      setError('Please select an assigned supervisor');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorId,
          title: title || (patientName ? `Case for ${patientName}` : 'New Clinical Case'),
          patientName,
          patientCode,
          patientAge,
          patientGender,
          patientContact,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create case');

      // Redirect immediately to the 5-tab editor
      router.push(`/app/cases/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Case creation failed');
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
          Assigned Clinical Supervisor <span className="text-brand-danger">*</span>
        </label>
        <select
          value={supervisorId}
          onChange={(e) => setSupervisorId(e.target.value)}
          required
          className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
        >
          <option value="">Select your designated supervisor</option>
          {supervisors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} {s.designation ? `(${s.designation})` : ''}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-brand-text-muted">
          Supervisors must be active members of the PIPOS clinical faculty.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Patient Full Name
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Tariq Mehmood"
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Patient MR / Code (Optional)
          </label>
          <input
            type="text"
            value={patientCode}
            onChange={(e) => setPatientCode(e.target.value)}
            placeholder="e.g. PIPOS-2026-MR01"
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Case Title / Description
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Transtibial Prosthesis Fitting"
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Patient Age
          </label>
          <input
            type="text"
            value={patientAge}
            onChange={(e) => setPatientAge(e.target.value)}
            placeholder="e.g. 28"
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Gender
          </label>
          <select
            value={patientGender}
            onChange={(e) => setPatientGender(e.target.value)}
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
            Patient Contact Number
          </label>
          <input
            type="text"
            value={patientContact}
            onChange={(e) => setPatientContact(e.target.value)}
            placeholder="03XX-XXXXXXX"
            className="w-full rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-brand-border-default">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent/90 disabled:opacity-50 transition-all shadow-sm"
        >
          {loading ? 'Creating Case...' : 'Create Case & Open Editor'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
