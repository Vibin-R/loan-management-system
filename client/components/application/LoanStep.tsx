'use client';

import { useMemo, useState } from 'react';
import { borrowerApi } from '@/lib/borrowerApi';
import { useSubmitError } from '@/lib/formErrors';
import { formatINR, formatINRWhole } from '@/lib/format';
import { ANNUAL_INTEREST_RATE, LOAN_LIMITS, calculateLoan } from '@/lib/loanMath';
import type { Loan } from '@/lib/types';
import { StepNav } from './StepNav';
import { Slider } from '@/components/ui/Slider';

interface LoanStepProps {
  onBack: () => void;
  onApplied: (loan: Loan) => void;
}

const formatDays = (days: number) => `${days} days`;

/** Step 4: choose amount and tenure with a live repayment breakdown, then apply. */
export function LoanStep({ onBack, onApplied }: LoanStepProps) {
  const [principal, setPrincipal] = useState(100_000);
  const [tenureDays, setTenureDays] = useState(180);
  const showSubmitError = useSubmitError();
  const [submitting, setSubmitting] = useState(false);

  const quote = useMemo(() => calculateLoan(principal, tenureDays), [principal, tenureDays]);

  async function handleApply() {
    setSubmitting(true);
    try {
      const { loan } = await borrowerApi.applyForLoan(principal, tenureDays);
      onApplied(loan);
    } catch (err) {
      showSubmitError(err, { fallback: 'Could not submit your application.' });
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[1fr_17rem]">
        <div className="space-y-8 rounded-2xl border border-border p-5">
          <Slider
            label="Loan amount"
            value={principal}
            min={LOAN_LIMITS.minPrincipal}
            max={LOAN_LIMITS.maxPrincipal}
            step={LOAN_LIMITS.principalStep}
            onChange={setPrincipal}
            format={formatINRWhole}
          />
          <Slider
            label="Tenure"
            value={tenureDays}
            min={LOAN_LIMITS.minTenureDays}
            max={LOAN_LIMITS.maxTenureDays}
            step={1}
            onChange={setTenureDays}
            format={formatDays}
          />
        </div>

        <aside aria-live="polite" className="space-y-4 rounded-2xl bg-ink p-5 text-ink-foreground">
          <p className="text-xs uppercase tracking-wider text-ink-foreground/60">Your repayment</p>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-foreground/70">Principal</dt>
              <dd className="tabular-nums">{formatINR(quote.principal)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-foreground/70">Interest ({ANNUAL_INTEREST_RATE}% p.a.)</dt>
              <dd className="tabular-nums">{formatINR(quote.interest)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-white/15 pt-3">
              <dt className="font-medium">Total repayment</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {formatINR(quote.totalRepayment)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-ink-foreground/60">
            Simple interest: P × {ANNUAL_INTEREST_RATE} × {tenureDays} ÷ (365 × 100)
          </p>
        </aside>
      </div>

      <StepNav
        onPrevious={onBack}
        nextLabel={`Apply for ${formatINRWhole(principal)}`}
        onNext={() => void handleApply()}
        busy={submitting}
      />
    </div>
  );
}
