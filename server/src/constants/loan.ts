export const LOAN_STATUS = {
  APPLIED: 'APPLIED',
  SANCTIONED: 'SANCTIONED',
  REJECTED: 'REJECTED',
  DISBURSED: 'DISBURSED',
  CLOSED: 'CLOSED',
} as const;

export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS];

/** Statuses in which a loan is still open; a borrower may have at most one such loan. */
export const ACTIVE_LOAN_STATUSES: LoanStatus[] = [
  LOAN_STATUS.APPLIED,
  LOAN_STATUS.SANCTIONED,
  LOAN_STATUS.DISBURSED,
];

export const EMPLOYMENT_MODES = {
  SALARIED: 'SALARIED',
  SELF_EMPLOYED: 'SELF_EMPLOYED',
  UNEMPLOYED: 'UNEMPLOYED',
} as const;

export type EmploymentMode = (typeof EMPLOYMENT_MODES)[keyof typeof EMPLOYMENT_MODES];

/** Product rules from the brief. Amounts in rupees. */
export const LOAN_RULES = {
  annualInterestRate: 12,
  minPrincipal: 50_000,
  maxPrincipal: 500_000,
  minTenureDays: 30,
  maxTenureDays: 365,
} as const;

/** Business Rule Engine thresholds. */
export const BRE_RULES = {
  minAge: 23,
  maxAge: 50,
  minMonthlySalary: 25_000,
  panPattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
} as const;
