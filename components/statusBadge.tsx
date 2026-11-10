import type { CaseStatus } from '@/db/schema';

interface StatusBadgeProps {
  status: CaseStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    Draft: 'bg-brand-subtle text-brand-text-secondary border-brand-border-default',
    Assigned: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
    'In Progress': 'bg-brand-warning-bg text-brand-warning border-brand-warning-border',
    'Completed - Awaiting Approval': 'bg-brand-warning-bg/80 text-brand-warning border-brand-warning-border',
    'Revision Required': 'bg-brand-danger-bg text-brand-danger border-brand-danger-border',
    Approved: 'bg-brand-success-bg text-brand-success border-brand-success-border',
  };

  const currentStyle = styles[status] || 'bg-brand-subtle text-brand-text-secondary border-brand-border-default';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${currentStyle} ${className}`}
    >
      {status}
    </span>
  );
}
