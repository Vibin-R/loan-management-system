import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './AppError';

/**
 * The token only identifies the user. Permissions are resolved on the server for every request
 * (see services/permission.service.ts), so editing a role never leaves stale rights in old tokens.
 */
export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

/** Returns the user id from a valid token, or throws 401. */
export function verifyAccessToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub) throw new Error('Token has no subject');
    return payload.sub;
  } catch {
    throw AppError.unauthenticated('Your session has expired. Please log in again.');
  }
}
