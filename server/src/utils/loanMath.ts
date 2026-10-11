import { LOAN_RULES } from '../constants/loan';

export interface LoanQuotePaise {
  principal: number;
  interest: number;
  totalRepayment: number;
}

/**
 * Simple interest, as specified in the brief:
 *   SI = (P × R × T) / (365 × 100),  R = 12% p.a., T = tenure in days
 *   Total = P + SI
 * Works in paise; the interest is rounded to the nearest paisa once.
 * The client shows the same numbers from an identical function, but only this one is saved.
 */
export function calculateLoan(principalPaise: number, tenureDays: number): LoanQuotePaise {
  const interest = Math.round(
    (principalPaise * LOAN_RULES.annualInterestRate * tenureDays) / (365 * 100),
  );
  return { principal: principalPaise, interest, totalRepayment: principalPaise + interest };
}
