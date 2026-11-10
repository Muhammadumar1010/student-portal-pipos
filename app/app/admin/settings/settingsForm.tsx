'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [form, setForm] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setMessage({ type: 'success', text: 'System settings saved successfully.' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs">
      {message && (
        <div
          className={`rounded-lg p-4 text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-brand-success-bg text-brand-success border-brand-success-border'
              : 'bg-brand-danger-bg text-brand-danger border-brand-danger-border'
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="block font-semibold text-brand-text-secondary mb-1">
          Institution Full Name
        </label>
        <input
          type="text"
          value={form.institution_name || ''}
          onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
          className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2.5 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
        />
        <p className="mt-1 text-[11px] text-brand-text-muted">
          Displayed on top of clinical printable case reports and official patient documents.
        </p>
      </div>

      <div>
        <label className="block font-semibold text-brand-text-secondary mb-1">
          Department / Clinical Division
        </label>
        <input
          type="text"
          value={form.department_name || ''}
          onChange={(e) => setForm({ ...form, department_name: e.target.value })}
          className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2.5 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
        />
      </div>

      <div>
        <label className="block font-semibold text-brand-text-secondary mb-1">
          Clinical Report Footer Notice
        </label>
        <input
          type="text"
          value={form.report_footer || ''}
          onChange={(e) => setForm({ ...form, report_footer: e.target.value })}
          className="w-full rounded-lg border border-brand-border-default bg-brand-page p-2.5 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-brand-border-default">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-accent/90 disabled:opacity-50 transition-colors shadow-sm"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
