import { Types } from 'mongoose';
import { z } from 'zod';
import { APPLICATION_STAGES } from '../constants/applicationStage';
import { parseCalendarDate } from '../utils/dates';
import { rupeesSchema } from '../utils/money';
import { listQuerySchema } from '../utils/pagination';

/** `:id` route param. A malformed id is rejected with 400 before any query runs. */
export const idParamSchema = z.object({
  id: z.string().refine((id) => Types.ObjectId.isValid(id), 'Invalid id'),
});

export const leadsQuerySchema = listQuerySchema.extend({
  stage: z
    .enum([
      APPLICATION_STAGES.REGISTERED,
      APPLICATION_STAGES.BRE_FAILED,
      APPLICATION_STAGES.ELIGIBLE,
    ])
    .optional(),
});

export const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Give a reason of at least 5 characters')
    .max(500, 'Reason must be at most 500 characters'),
});

export const paymentSchema = z.object({
  utr: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6,30}$/, 'UTR must be 6–30 letters or digits'),
  amount: rupeesSchema,
  paidOn: z.string().transform((value, ctx) => {
    const date = parseCalendarDate(value);
    if (!date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid payment date' });
      return z.NEVER;
    }
    return date;
  }),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type LeadsQuery = z.infer<typeof leadsQuerySchema>;
export type RejectInput = z.infer<typeof rejectSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
