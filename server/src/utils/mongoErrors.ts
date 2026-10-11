import { AppError } from './AppError';

/**
 * Maps MongoDB duplicate-key errors (E11000) on known unique indexes to 409 responses,
 * so a race such as a double-click never surfaces as a 500.
 * Keys are the indexed field names as they appear in the error's `keyPattern`.
 */
const DUPLICATE_KEY_ERRORS: Record<string, { code: string; message: string }> = {
  email: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' },
  borrowerId: {
    code: 'ACTIVE_LOAN_EXISTS',
    message: 'You already have a loan application in progress',
  },
  utr: { code: 'DUPLICATE_UTR', message: 'A payment with this UTR number is already recorded' },
  name: { code: 'ROLE_EXISTS', message: 'A role with this name already exists' },
};

interface MongoDuplicateKeyError {
  code: 11000;
  keyPattern?: Record<string, unknown>;
}

const isDuplicateKeyError = (err: unknown): err is MongoDuplicateKeyError =>
  typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;

export function mapDuplicateKeyError(err: unknown): AppError | null {
  if (!isDuplicateKeyError(err)) return null;
  const field = Object.keys(err.keyPattern ?? {})[0] ?? '';
  const known = DUPLICATE_KEY_ERRORS[field];
  return known
    ? AppError.conflict(known.code, known.message)
    : AppError.conflict('DUPLICATE', 'This record already exists');
}

const UNAVAILABLE_ERROR_NAMES = new Set([
  'MongoServerSelectionError',
  'MongoNetworkError',
  'MongoNetworkTimeoutError',
  'MongoNotConnectedError',
]);

/** True when the database is unreachable, so the API can answer 503 instead of 500. */
export const isDatabaseUnavailableError = (err: unknown): boolean =>
  err instanceof Error &&
  (UNAVAILABLE_ERROR_NAMES.has(err.name) || /buffering timed out/i.test(err.message));
