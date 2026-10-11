/**
 * Client-side checks that mirror server/src/validators. They give instant feedback;
 * the server validates again and its field errors are shown if anything slips through.
 * Each function returns an error message, or undefined when the value is valid.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(value: string): string | undefined {
  const name = value.trim();
  if (name.length < 2) return 'Name must be at least 2 characters';
  if (name.length > 80) return 'Name must be at most 80 characters';
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Enter your email address';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address';
  return undefined;
}

export function validateNewPassword(value: string): string | undefined {
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (value.length > 72) return 'Password must be at most 72 characters';
  if (!/[A-Za-z]/.test(value)) return 'Password must contain a letter';
  if (!/\d/.test(value)) return 'Password must contain a number';
  return undefined;
}

export function validateRequired(value: string, label: string): string | undefined {
  return value ? undefined : `Enter your ${label}`;
}

/** Keeps only the fields that have an error. */
export function collectErrors<T extends string>(
  checks: Record<T, string | undefined>,
): Partial<Record<T, string>> {
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as Partial<
    Record<T, string>
  >;
}
