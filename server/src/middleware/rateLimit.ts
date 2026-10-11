import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError';

/**
 * Limits login and signup attempts per IP to slow down password guessing.
 * Uses the in-memory store; with several server instances, switch to a Redis store.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new AppError(429, 'TOO_MANY_REQUESTS', 'Too many attempts. Please wait a few minutes.')),
});

/** A generous ceiling for the whole API, to absorb accidental request loops. */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new AppError(429, 'TOO_MANY_REQUESTS', 'Too many requests. Please slow down.')),
});
