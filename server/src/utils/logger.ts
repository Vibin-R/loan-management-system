import pino from 'pino';
import { env, isProduction } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  // Never write credentials or tokens to the logs.
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash'],
  ...(isProduction ? {} : { transport: { target: 'pino-pretty', options: { colorize: true } } }),
});
