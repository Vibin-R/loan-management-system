import type { EmploymentMode } from './types';

/**
 * Client copy of the eligibility rules (server/src/services/bre.service.ts).
 * Used only for instant hints while typing; the server runs the real check on submit and its
 * answer is the one that counts.
 */
export const BRE_RULES = {
  minAge: 23,
  maxAge: 50,
  minMonthlySalary: 25_000,
  panPattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
} as const;

export const EMPLOYMENT_OPTIONS: { value: EmploymentMode; label: string; hint: string }[] = [
  { value: 'SALARIED', label: 'Salaried', hint: 'Employed with a monthly salary' },
  { value: 'SELF_EMPLOYED', label: 'Self-employed', hint: 'Business owner or freelancer' },
  { value: 'UNEMPLOYED', label: 'Unemployed', hint: 'Not currently earning' },
];

/** Completed years from a YYYY-MM-DD birth date to today (local calendar), or null if invalid. */
export function ageFromDob(dob: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const today = new Date();
  const hadBirthday =
    today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d);
  return today.getFullYear() - y - (hadBirthday ? 0 : 1);
}

/** A short hint for each field that would fail the eligibility check, keyed by field name. */
export function eligibilityHints(values: {
  pan: string;
  dob: string;
  monthlySalary: string;
  employmentMode: EmploymentMode | '';
}): Partial<Record<'pan' | 'dob' | 'monthlySalary' | 'employmentMode', string>> {
  const hints: Partial<Record<'pan' | 'dob' | 'monthlySalary' | 'employmentMode', string>> = {};

  if (values.pan.length === 10 && !BRE_RULES.panPattern.test(values.pan)) {
    hints.pan = 'PAN format is 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)';
  }
  const age = values.dob ? ageFromDob(values.dob) : null;
  if (age !== null && (age < BRE_RULES.minAge || age > BRE_RULES.maxAge)) {
    hints.dob = `You are ${age}. Applicants must be ${BRE_RULES.minAge}–${BRE_RULES.maxAge} years old.`;
  }
  const salary = Number(values.monthlySalary);
  if (values.monthlySalary && salary > 0 && salary < BRE_RULES.minMonthlySalary) {
    hints.monthlySalary = 'Minimum monthly salary is ₹25,000';
  }
  if (values.employmentMode === 'UNEMPLOYED') {
    hints.employmentMode = 'Applicants must be salaried or self-employed';
  }
  return hints;
}
