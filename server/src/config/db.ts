import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

mongoose.set('strictQuery', true);

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));

  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 20,
  });
  transactionsSupported = await detectTransactionSupport();
  logger.info(
    { db: mongoose.connection.name, transactions: transactionsSupported },
    transactionsSupported
      ? 'MongoDB connected (replica set: payments use transactions)'
      : 'MongoDB connected (standalone: payments use guarded atomic updates)',
  );
}

let transactionsSupported = false;

/** Transactions need a replica set or sharded cluster (Atlas always is one). */
async function detectTransactionSupport(): Promise<boolean> {
  const db = mongoose.connection.db;
  if (!db) return false;
  const hello = await db.admin().command({ hello: 1 });
  return Boolean(hello.setName) || hello.msg === 'isdbgrid';
}

export const supportsTransactions = (): boolean => transactionsSupported;

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB connection closed');
}

/** True when the connection is open and queries can run. */
export const isDatabaseReady = (): boolean =>
  mongoose.connection.readyState === mongoose.ConnectionStates.connected;
