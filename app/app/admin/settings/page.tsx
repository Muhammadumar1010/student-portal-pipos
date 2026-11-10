import { requireUser } from '@/lib/auth';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { SettingsForm } from './settingsForm';

export default async function AdminSettingsPage() {
  await requireUser(['admin']);

  const rows = await db.select().from(settings);
  const settingsMap: Record<string, string> = {
    institution_name: 'Pakistan Institute of Prosthetic & Orthotic Sciences',
    department_name: 'Prosthetic & Orthotic Sciences',
    report_footer: 'P&O Clinical Case Management System',
  };

  for (const r of rows) {
    if (r.value !== null) settingsMap[r.key] = r.value;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
          Institutional & System Settings
        </h1>
        <p className="text-xs text-brand-text-muted mt-1">
          Configure branding, academic department nomenclature, and clinical report signatures.
        </p>
      </div>

      <div className="rounded-xl border border-brand-border-default bg-brand-page p-6 sm:p-8 shadow-sm">
        <SettingsForm initialSettings={settingsMap} />
      </div>
    </div>
  );
}
