import type { Request, RequestHandler } from 'express';
import { getUserAccess, type UserAccess } from '../services/permission.service';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';

const BEARER_PREFIX = 'Bearer ';

/** Verifies the bearer token and attaches the caller's access to `req.user`. Missing/invalid → 401. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) throw AppError.unauthenticated();

  const userId = verifyAccessToken(header.slice(BEARER_PREFIX.length).trim());
  req.user = await getUserAccess(userId);
  next();
};

/** The authenticated caller. Use only on routes behind `authenticate`. */
export function getAuthUser(req: Request): UserAccess {
  if (!req.user) throw AppError.unauthenticated();
  return req.user;
}
