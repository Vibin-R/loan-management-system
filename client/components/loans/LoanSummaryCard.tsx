import { formatDate, formatINR } from '@/lib/format';
import type { Loan } from '@/lib/types';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from './StatusBadge';
import { StatusTimeline } from './StatusTimeline';

/** A borrower's view of one loan: amounts, repayment progress and status timeline. */
export function LoanSummaryCard({ loan }: { loan: Loan }) {
  const showRepayment = loan.status === 'DISBURSED' || loan.status === 'CLOSED';
  const paidPercent = Math.min(100, (loan.amountPaid / loan.totalRepayment) * 100);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-xs text-muted">Applied {formatDate(loan.createdAt)}</p>
          <p className="text-2xl font-semibold tabular-nums">{formatINR(loan.principal)}</p>
          <p className="text-sm text-muted">
            {loan.tenureDays} days at {loan.annualRate}% p.a.
          </p>
        </div>
        <StatusBadge status={loan.status} />
      </header>

      <div className="grid gap-6 px-5 py-5 md:grid-cols-[1fr_15rem]">
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-background p-3">
              <dt className="text-muted">Interest</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatINR(loan.interest)}</dd>
            </div>
            <div className="rounded-xl bg-background p-3">
              <dt className="text-muted">Total repayment</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatINR(loan.totalRepayment)}</dd>
            </div>
          </dl>

          {showRepayment && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Repaid {formatINR(loan.amountPaid)}</span>
                <span className="font-medium tabular-nums">
                  {formatINR(loan.outstanding)} outstanding
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-success"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          )}

          {loan.status === 'REJECTED' && loan.rejectionReason && (
            <Alert>
              <span className="font-medium">Reason: </span>
              {loan.rejectionReason}
            </Alert>
          )}
        </div>

        <StatusTimeline loan={loan} />
      </div>
    </article>
  );
}
