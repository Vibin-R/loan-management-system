'use client';

import { useCallback } from 'react';
import { ApiError } from './api';
import { useToast } from './toast';

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

/** API error codes that are about one input, mapped to that input's field name. */
const FIELD_FOR_CODE: Record<string, string> = {
  INVALID_CREDENTIALS: 'password',
  EMAIL_TAKEN: 'email',
  DUPLICATE_UTR: 'utr',
  AMOUNT_EXCEEDS_OUTSTANDING: 'amount',
  FILE_TOO_LARGE: 'file',
  UNSUPPORTED_FILE_TYPE: 'file',
};

/** The parts of an API error that belong to inputs on this form, or null if none do. */
export function fieldErrorsFor<F extends string>(
  err: unknown,
  fields: readonly F[],
): FieldErrors<F> | null {
  if (!(err instanceof ApiError)) return null;
  const onForm = (field: string): field is F => (fields as readonly string[]).includes(field);

  const found: FieldErrors<F> = {};
  for (const [field, message] of Object.entries(err.fieldErrors)) {
    if (onForm(field)) found[field] = message;
  }
  const mapped = FIELD_FOR_CODE[err.code];
  if (mapped && onForm(mapped)) found[mapped] = err.message;

  return Object.keys(found).length > 0 ? found : null;
}

interface SubmitErrorOptions<F extends string> {
  /** Inputs on this form; errors about them are shown as the input's helper text. */
  fields?: readonly F[];
  setErrors?: (errors: FieldErrors<F>) => void;
  /** Shown when the error has no usable message (e.g. an unexpected client-side failure). */
  fallback: string;
}

/**
 * Routes a failed action: errors about an input go under that input, everything else
 * (server unreachable, conflicts, server errors) is shown as an error toast.
 */
export function useSubmitError() {
  const toast = useToast();
  return useCallback(
    <F extends string>(err: unknown, { fields, setErrors, fallback }: SubmitErrorOptions<F>) => {
      const fieldErrors = fields && setErrors ? fieldErrorsFor(err, fields) : null;
      if (fieldErrors && setErrors) {
        setErrors(fieldErrors);
        return;
      }
      toast(err instanceof ApiError ? err.message : fallback, 'error');
    },
    [toast],
  );
}
