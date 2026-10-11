/**
 * Loan maths shared by the calculator and previews. Mirrors server/src/utils/loanMath.ts;
 * the server recomputes on apply and its numbers are the ones saved.
 *
 *   SI    = (P × R × T) / (365 × 100)   R = 12% p.a., T = tenure in days
 *   Total = P + SI
 *
 * Worked in paise so totals are exact.
 */
export const ANNUAL_INTEREST_RATE = 12;

export const LOAN_LIMITS = {
  minPrincipal: 50_000,
  maxPrincipal: 500_000,
  principalStep: 5_000,
  minTenureDays: 30,
  maxTenureDays: 365,
} as const;

export interface LoanQuote {
  principal: number;
  tenureDays: number;
  interest: number;
  totalRepayment: number;
}

/** Amounts in and out are rupees; rounding to the paisa happens once, on the interest. */
export function calculateLoan(principal: number, tenureDays: number): LoanQuote {
  const principalPaise = Math.round(principal * 100);
  const interestPaise = Math.round((principalPaise * ANNUAL_INTEREST_RATE * tenureDays) / 36_500);
  return {
    principal,
    tenureDays,
    interest: interestPaise / 100,
    totalRepayment: (principalPaise + interestPaise) / 100,
  };
}
