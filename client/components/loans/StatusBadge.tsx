import type { LoanStatus } from '@/lib/types';

export const STATUS_LABELS: Record<LoanStatus, string> = {
  APPLIED: 'Applied',
  SANCTIONED: 'Sanctioned',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
  CLOSED: 'Closed',
};

const STATUS_CLASSES: Record<LoanStatus, string> = {
  APPLIED: 'bg-primary/10 text-primary',
  SANCTIONED: 'bg-warning/10 text-warning',
  REJECTED: 'bg-danger/10 text-danger',
  DISBURSED: 'bg-success/10 text-success',
  CLOSED: 'bg-foreground/10 text-foreground',
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
