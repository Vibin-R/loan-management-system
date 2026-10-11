import { z } from 'zod';

/**
 * The API speaks rupees; everything inside the server is integer paise, so sums and the
 * "fully repaid" comparison are exact. These are the only conversion points.
 */
export const toPaise = (rupees: number): number => Math.round(rupees * 100);

export const toRupees = (paise: number): number => paise / 100;

const hasAtMostTwoDecimals = (value: number): boolean =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

/** A positive rupee amount with at most 2 decimal places. */
export const rupeesSchema = z
  .number({ invalid_type_error: 'Enter an amount' })
  .positive('Amount must be greater than zero')
  .refine(hasAtMostTwoDecimals, { message: 'Amount can have at most 2 decimal places' });
