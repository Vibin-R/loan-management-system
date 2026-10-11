import type { Server } from 'node:http';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { createApp } from './app';
import { logger } from './utils/logger';

let server: Server | undefined;

async function start(): Promise<void> {
  await connectDatabase();
  const app = createApp();
  server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}/api/v1`);
  });
}

/**
 * Stops accepting new requests, lets in-flight ones finish, then closes the database.
 * Forces an exit after 10 s so a stuck connection can't block a deploy.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  try {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    await disconnectDatabase();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  void shutdown('uncaughtException');
});

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
