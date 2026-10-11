import { z } from 'zod';
import { EMPLOYMENT_MODES, LOAN_RULES } from '../constants/loan';
import { compareCalendarDates, parseCalendarDate, todayIST } from '../utils/dates';
import { rupeesSchema } from '../utils/money';

/**
 * Shape checks only. Eligibility (age range, minimum salary, PAN format, employment) is the
 * BRE's job, so those failures come back as one clear 422 rather than as field errors.
 */
export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter your full name')
    .max(100, 'Name must be at most 100 characters'),
  pan: z.string().trim().toUpperCase().length(10, 'PAN must be 10 characters'),
  dob: z.string().transform((value, ctx) => {
    const date = parseCalendarDate(value);
    if (!date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid date of birth' });
      return z.NEVER;
    }
    if (compareCalendarDates(date, todayIST()) > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date of birth cannot be in the future',
      });
      return z.NEVER;
    }
    return date;
  }),
  monthlySalary: rupeesSchema,
  employmentMode: z.nativeEnum(EMPLOYMENT_MODES, {
    errorMap: () => ({ message: 'Choose your employment type' }),
  }),
});

export const applySchema = z.object({
  principal: z
    .number({ invalid_type_error: 'Choose a loan amount' })
    .int('Loan amount must be in whole rupees')
    .min(LOAN_RULES.minPrincipal, 'Minimum loan amount is ₹50,000')
    .max(LOAN_RULES.maxPrincipal, 'Maximum loan amount is ₹5,00,000'),
  tenureDays: z
    .number({ invalid_type_error: 'Choose a tenure' })
    .int('Tenure must be a whole number of days')
    .min(LOAN_RULES.minTenureDays, 'Minimum tenure is 30 days')
    .max(LOAN_RULES.maxTenureDays, 'Maximum tenure is 365 days'),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ApplyInput = z.infer<typeof applySchema>;
