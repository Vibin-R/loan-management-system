import { BRE_RULES, EMPLOYMENT_MODES, type EmploymentMode } from '../constants/loan';
import { ageOn, type CalendarDate } from '../utils/dates';

export type BreRule = 'AGE' | 'SALARY' | 'PAN' | 'EMPLOYMENT';

export interface BreFailure {
  rule: BreRule;
  message: string;
}

export interface BreInput {
  dob: CalendarDate;
  monthlySalaryRupees: number;
  pan: string;
  employmentMode: EmploymentMode;
}

interface RuleCheck {
  rule: BreRule;
  passes: (input: BreInput) => boolean;
  message: string;
}

/**
 * Business Rule Engine. Runs on the server, which is the source of truth: client-side checks
 * only give instant feedback and can be bypassed. Every rule runs, and every failure is
 * returned, so the borrower can fix everything at once.
 */
const RULES: RuleCheck[] = [
  {
    rule: 'AGE',
    passes: ({ dob }) => {
      const age = ageOn(dob);
      return age >= BRE_RULES.minAge && age <= BRE_RULES.maxAge;
    },
    message: `You must be between ${BRE_RULES.minAge} and ${BRE_RULES.maxAge} years old.`,
  },
  {
    rule: 'SALARY',
    passes: ({ monthlySalaryRupees }) => monthlySalaryRupees >= BRE_RULES.minMonthlySalary,
    message: 'Monthly salary must be at least ₹25,000.',
  },
  {
    rule: 'PAN',
    passes: ({ pan }) => BRE_RULES.panPattern.test(pan),
    message: 'Enter a valid PAN, for example ABCDE1234F.',
  },
  {
    rule: 'EMPLOYMENT',
    passes: ({ employmentMode }) => employmentMode !== EMPLOYMENT_MODES.UNEMPLOYED,
    message: 'Applicants must be salaried or self-employed.',
  },
];

export function evaluateEligibility(input: BreInput): BreFailure[] {
  return RULES.filter((check) => !check.passes(input)).map(({ rule, message }) => ({
    rule,
    message,
  }));
}
