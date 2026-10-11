/**
 * An expected, client-facing error. Throw it anywhere; the error handler turns it into
 * `{ error: { code, message, details } }` with the given HTTP status.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthenticated(message = 'Please log in to continue') {
    return new AppError(401, 'UNAUTHENTICATED', message);
  }

  static forbidden(message = 'You do not have permission to do this') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(resource = 'Resource') {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(code: string, message: string) {
    return new AppError(409, code, message);
  }

  static unprocessable(code: string, message: string, details?: unknown) {
    return new AppError(422, code, message, details);
  }
}
