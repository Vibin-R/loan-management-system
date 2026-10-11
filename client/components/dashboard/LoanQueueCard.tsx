import { formatDate, formatINR } from '@/lib/format';
import type { Loan } from '@/lib/types';
import { STATUS_TINT, StatusBadge } from '@/components/loans/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { ClockIcon } from '@/components/ui/icons';

interface LoanQueueCardProps {
  loan: Loan;
  /** Buttons for this module, e.g. Review or Disburse. */
  actions: React.ReactNode;
  /** Extra content under the amount, e.g. a repayment bar. */
  children?: React.ReactNode;
}

/**
 * One loan in a module queue as a list row: who, how much, status, when, and the module's
 * actions. Columns line up on desktop and stack on phones.
 */
export function LoanQueueCard({ loan, actions, children }: LoanQueueCardProps) {
  return (
    <article className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <Avatar name={loan.applicant.fullName} tone={STATUS_TINT[loan.status]} />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{loan.applicant.fullName}</h3>
          <p className="truncate text-xs text-muted">
            {loan.applicant.email} · <span className="font-mono">{loan.applicant.pan}</span>
          </p>
        </div>
      </div>

      <div className="min-w-0 pl-[3.375rem] sm:w-48 sm:pl-0">
        <p className="text-sm font-semibold tabular-nums">{formatINR(loan.principal)}</p>
        <p className="text-xs text-muted">
          {loan.tenureDays} days · repay {formatINR(loan.totalRepayment)}
        </p>
        {children}
      </div>

      <div className="flex items-center gap-5 pl-[3.375rem] sm:contents">
        <div className="sm:w-28">
          <StatusBadge status={loan.status} />
        </div>
        <p className="flex items-center gap-1.5 whitespace-nowrap text-sm text-muted sm:w-28">
          <ClockIcon className="h-4 w-4" />
          {formatDate(loan.createdAt)}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 pl-[3.375rem] sm:pl-0">{actions}</div>
    </article>
  );
}
