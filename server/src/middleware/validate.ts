import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

/**
 * Validates and parses part of the request with a zod schema.
 * On success the parsed (typed, trimmed, coerced) value is stored on `res.locals[part]`;
 * on failure the ZodError goes to the error handler and becomes a 400 with field errors.
 *
 * Usage: router.post('/', validate('body', loginSchema), controller)
 *        then in the controller: const input = res.locals.body as z.infer<typeof loginSchema>
 */
export const validate =
  <T extends ZodTypeAny>(part: 'body' | 'query' | 'params', schema: T): RequestHandler =>
  (req, res, next) => {
    const parsed: z.infer<T> = schema.parse(req[part]);
    res.locals[part] = parsed;
    next();
  };
