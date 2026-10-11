import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { isDatabaseUnavailableError, mapDuplicateKeyError } from '../utils/mongoErrors';
import { logger } from '../utils/logger';

/** 404 for any route that doesn't exist. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `No route for ${req.method} ${req.originalUrl}`));
};

/**
 * The single place errors become HTTP responses. Every error has the same shape:
 * `{ error: { code, message, details? } }`. Unexpected errors are logged with their stack
 * and returned as a generic 500, so internals never leak to the client.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const appError = toAppError(err);

  if (appError.statusCode >= 500) {
    logger.error({ err, path: req.originalUrl, method: req.method }, 'Request failed');
  }

  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details !== undefined ? { details: appError.details } : {}),
    },
  });
};

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    return AppError.badRequest(
      'Some fields are invalid',
      err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    );
  }

  if (err instanceof MulterError) {
    return err.code === 'LIMIT_FILE_SIZE'
      ? new AppError(413, 'FILE_TOO_LARGE', `File is larger than ${env.MAX_UPLOAD_MB} MB.`)
      : AppError.badRequest('Upload one file in the "file" field');
  }

  const duplicate = mapDuplicateKeyError(err);
  if (duplicate) return duplicate;

  if (isDatabaseUnavailableError(err)) {
    return new AppError(
      503,
      'SERVICE_UNAVAILABLE',
      'The service is temporarily unavailable. Please try again shortly.',
    );
  }

  // Malformed JSON body
  if (err instanceof SyntaxError && 'body' in err) {
    return AppError.badRequest('Request body is not valid JSON');
  }

  // Invalid ObjectId in a route param, e.g. /loans/abc
  if (err instanceof Error && err.name === 'CastError') {
    return AppError.notFound();
  }

  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}
