import type { LoanStatus } from '@/lib/types';

export const STATUS_LABELS: Record<LoanStatus, string> = {
  APPLIED: 'Applied',
  SANCTIONED: 'Sanctioned',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
  CLOSED: 'Closed',
};

/** Dot colour per status. Also used to tint avatars in queues. */
export const STATUS_DOT: Record<LoanStatus, string> = {
  APPLIED: 'bg-primary',
  SANCTIONED: 'bg-warning',
  REJECTED: 'bg-danger',
  DISBURSED: 'bg-success',
  CLOSED: 'bg-muted',
};

export const STATUS_TINT: Record<LoanStatus, string> = {
  APPLIED: 'bg-primary/10 text-primary',
  SANCTIONED: 'bg-warning/10 text-warning',
  REJECTED: 'bg-danger/10 text-danger',
  DISBURSED: 'bg-success/10 text-success',
  CLOSED: 'bg-foreground/10 text-foreground',
};

/** Coloured dot plus label, e.g. "● Sanctioned". */
export function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
