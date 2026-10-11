import { formatDateTime } from '@/lib/format';
import type { Loan, LoanStatus } from '@/lib/types';
import { CheckIcon } from '@/components/ui/icons';
import { STATUS_LABELS } from './StatusBadge';

const HAPPY_PATH: LoanStatus[] = ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED'];

const NEXT_STEP_TEXT: Partial<Record<LoanStatus, string>> = {
  APPLIED: 'Our team is reviewing your application.',
  SANCTIONED: 'Approved. Funds will be released to your account shortly.',
  DISBURSED: 'Funds released. Repay by the end of your tenure.',
};

/**
 * Loan progress from the loan's history. A rejected loan shows the steps it reached and then
 * the rejection; any other loan shows the full path with reached steps ticked.
 */
export function StatusTimeline({ loan }: { loan: Loan }) {
  const reachedAt = new Map(loan.history.map((entry) => [entry.to, entry.at]));
  const steps: LoanStatus[] =
    loan.status === 'REJECTED'
      ? [...HAPPY_PATH.filter((s) => reachedAt.has(s)), 'REJECTED']
      : HAPPY_PATH;

  return (
    <div className="space-y-3">
      <ol className="space-y-0">
        {steps.map((step, i) => {
          const at = reachedAt.get(step);
          const reached = Boolean(at);
          const rejected = step === 'REJECTED';
          return (
            <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[11px] top-6 h-[calc(100%-1rem)] w-px ${reached ? 'bg-primary/40' : 'bg-border'}`}
                />
              )}
              <span
                className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                  rejected
                    ? 'bg-danger'
                    : reached
                      ? 'bg-primary'
                      : 'border-2 border-border bg-surface'
                }`}
              >
                {reached && !rejected && <CheckIcon className="h-3.5 w-3.5" />}
                {rejected && <span className="text-xs font-bold">✕</span>}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${reached ? '' : 'text-muted'}`}>
                  {STATUS_LABELS[step]}
                </p>
                {at && <p className="text-xs text-muted">{formatDateTime(at)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {NEXT_STEP_TEXT[loan.status] && (
        <p className="rounded-lg bg-background px-3 py-2 text-sm text-muted">
          {NEXT_STEP_TEXT[loan.status]}
        </p>
      )}
    </div>
  );
}
