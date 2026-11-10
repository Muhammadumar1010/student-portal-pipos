import Button from '@/components/Button';
import { requireUser } from '@/lib/auth';
import { Database, FileSpreadsheet, Download, ShieldCheck, HardDrive } from 'lucide-react';

export default async function AdminBackupPage() {
  await requireUser(['admin']);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 pt-6">
      <Button href="/app/admin" arrow="left" label='Back' />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
          Data Export & Institutional Backup
        </h1>
        <p className="text-xs text-brand-text-muted mt-1">
          Export clinical records, user accounts, and generate full portable database archives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Exports Card */}
        <div className="rounded-xl border border-brand-border-default bg-brand-page p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-success-bg text-brand-success mb-4">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-brand-text-primary">
              CSV Spreadsheet Exports
            </h2>
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Export data formatted for Excel, Google Sheets, or institutional audit analysis.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-lg border border-brand-border-default p-3 flex gap-2 items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-brand-text-primary block">
                    All Clinical Cases
                  </span>
                  <span className="text-[11px] text-brand-text-muted">
                    Patient demographic, category, diagnosis & review dates
                  </span>
                </div>
                <a
                  href="/api/exports/cases.csv"
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-accent/90 shadow-sm transition-colors"
                >
                  <Download className="h-4 w-4" /> CSV
                </a>
              </div>

              <div className="rounded-lg border border-brand-border-default p-3 flex gap-2 items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-brand-text-primary block">
                    User Accounts Directory
                  </span>
                  <span className="text-[11px] text-brand-text-muted">
                    Faculty, students, registration numbers and roles
                  </span>
                </div>
                <a
                  href="/api/exports/users.csv"
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-accent/90 shadow-sm transition-colors"
                >
                  <Download className="h-4 w-4" /> CSV
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Full JSON Backup Card */}
        <div className="rounded-xl border border-brand-border-default bg-brand-page p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-brand-text-primary">
              Full System JSON Backup
            </h2>
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Complete archive of cases, full clinical examination records, insert-only audit trails, and system settings.
            </p>

            <div className="mt-6 rounded-lg bg-brand-subtle p-4 border border-brand-border-default">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-text-primary mb-1">
                <ShieldCheck className="h-4 w-4 text-brand-accent" />
                Structured Cloud Backup (Option B)
              </div>
              <p className="text-[11px] text-brand-text-muted leading-relaxed">
                Includes all tables: <code className="text-brand-accent">users</code>,{' '}
                <code className="text-brand-accent">cases</code>,{' '}
                <code className="text-brand-accent">case_events</code>, and{' '}
                <code className="text-brand-accent">settings</code>. Excludes authentication secrets.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-brand-border-default">
            <a
              href="/api/backup"
              download
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-accent/90 shadow-sm transition-colors"
            >
              <Download className="h-4 w-4" /> Download Complete JSON Archive
            </a>
          </div>
        </div>
      </div>

      {/* Cloud Infrastructure Note */}
      <div className="rounded-xl border border-brand-border-default bg-brand-subtle/70 p-5 flex items-start gap-4">
        <HardDrive className="h-5 w-5 text-brand-text-muted shrink-0 mt-0.5" />
        <div className="text-xs text-brand-text-secondary leading-relaxed">
          <strong className="text-brand-text-primary font-semibold block mb-0.5">
            PostgreSQL Point-in-Time Recovery (PITR)
          </strong>
          The downloadable backup above provides a secondary offline disaster-recovery copy.
        </div>
      </div>
    </div>
  );
}
