import { formatINR, formatINRWhole } from '@/lib/format';
import { ANNUAL_INTEREST_RATE, LOAN_LIMITS, calculateLoan } from '@/lib/loanMath';
import { CheckIcon } from '@/components/ui/icons';

/** The example loan shown on the panel, computed with the same maths as the real calculator. */
const EXAMPLE = calculateLoan(100_000, 180);

const STAGES = [
  { label: 'Applied', done: true },
  { label: 'Sanctioned', done: true },
  { label: 'Disbursed', done: false },
  { label: 'Closed', done: false },
];

/** Dark brand panel beside the login and signup forms. Hidden on small screens. */
export function AuthShowcase() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-10 py-8 text-ink-foreground lg:flex lg:w-[52%] short:py-6">
      <p className="text-sm text-ink-foreground/70">
        Personal loans made simple, from application to repayment.
      </p>

      {/* Decorative rings behind the headline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[38%] top-[38%] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="h-[18rem] w-[18rem] rounded-full border border-white/10" />
        <div className="absolute inset-12 rounded-full border border-white/10" />
      </div>

      <div className="relative space-y-6 xl:space-y-8 short:space-y-4">
        <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight xl:text-5xl short:text-3xl">
          Borrow
          <br />
          with clarity
        </h2>

        <div className="max-w-sm rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl short:p-4 backdrop-blur">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wider text-ink-foreground/60">
              Loan preview
            </span>
            <span className="text-xs text-ink-foreground/60">{ANNUAL_INTEREST_RATE}% p.a.</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums short:mt-1 short:text-2xl">
            {formatINRWhole(EXAMPLE.principal)}
          </p>
          <p className="text-sm text-ink-foreground/60">for {EXAMPLE.tenureDays} days</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm short:mt-3">
            <div className="rounded-xl bg-white/[0.06] p-3">
              <dt className="text-ink-foreground/60">Interest</dt>
              <dd className="mt-1 font-medium tabular-nums">{formatINR(EXAMPLE.interest)}</dd>
            </div>
            <div className="rounded-xl bg-white/[0.06] p-3">
              <dt className="text-ink-foreground/60">You repay</dt>
              <dd className="mt-1 font-medium tabular-nums">{formatINR(EXAMPLE.totalRepayment)}</dd>
            </div>
          </dl>

          <ol
            className="mt-5 grid grid-cols-4 text-[11px] short:mt-3 tiny:hidden"
            aria-label="Loan status"
          >
            {STAGES.map((stage, i) => (
              <li key={stage.label} className="relative flex flex-col items-center gap-1.5">
                {/* Connector to the next step */}
                {i < STAGES.length - 1 && (
                  <span className="absolute left-1/2 top-2.5 h-px w-full bg-white/15" />
                )}
                <span
                  className={`relative flex h-5 w-5 items-center justify-center rounded-full ${
                    stage.done ? 'bg-primary-strong text-white' : 'border border-white/25 bg-ink'
                  }`}
                >
                  {stage.done && <CheckIcon className="h-3 w-3" />}
                </span>
                <span className={stage.done ? '' : 'text-ink-foreground/50'}>{stage.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="relative text-xs text-ink-foreground/60">
        {formatINRWhole(LOAN_LIMITS.minPrincipal)} to {formatINRWhole(LOAN_LIMITS.maxPrincipal)} ·{' '}
        {LOAN_LIMITS.minTenureDays} to {LOAN_LIMITS.maxTenureDays} days · fixed{' '}
        {ANNUAL_INTEREST_RATE}% simple interest
      </p>
    </aside>
  );
}
