import { formatDate, formatINR } from '@/lib/format';
import type { Loan } from '@/lib/types';
import { StatusBadge } from '@/components/loans/StatusBadge';

interface LoanQueueCardProps {
  loan: Loan;
  /** Buttons for this module, e.g. Review or Disburse. */
  actions: React.ReactNode;
  /** Extra content under the summary, e.g. a repayment bar. */
  children?: React.ReactNode;
}

/** One loan in a module queue: who, how much, and the module's actions. Stacks on phones. */
export function LoanQueueCard({ loan, actions, children }: LoanQueueCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-medium">{loan.applicant.fullName}</h3>
          <StatusBadge status={loan.status} />
        </div>
        <p className="truncate text-sm text-muted">
          {loan.applicant.email} · <span className="font-mono">{loan.applicant.pan}</span>
        </p>
        <p className="text-sm">
          <span className="font-semibold tabular-nums">{formatINR(loan.principal)}</span>
          <span className="text-muted">
            {' '}
            · {loan.tenureDays} days · repay {formatINR(loan.totalRepayment)} · applied{' '}
            {formatDate(loan.createdAt)}
          </span>
        </p>
        {children}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
    </article>
  );
}
