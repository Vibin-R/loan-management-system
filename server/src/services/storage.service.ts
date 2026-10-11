import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

/**
 * Stores uploaded files on local disk under UPLOAD_DIR.
 * Callers only see opaque storage keys (`<userId>/<uuid>.<ext>`), never user-supplied names,
 * so swapping this for S3 later only changes this file.
 */
const uploadRoot = path.resolve(env.UPLOAD_DIR);

export async function saveFile(ownerId: string, data: Buffer, extension: string): Promise<string> {
  const storageKey = `${ownerId}/${randomUUID()}.${extension}`;
  const target = resolveStoragePath(storageKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
  return storageKey;
}

export async function deleteFile(storageKey: string): Promise<void> {
  await unlink(resolveStoragePath(storageKey)).catch(() => undefined); // already gone is fine
}

/** Absolute path for a key, refusing anything that would escape the upload folder. */
export function resolveStoragePath(storageKey: string): string {
  const resolved = path.resolve(uploadRoot, storageKey);
  if (!resolved.startsWith(uploadRoot + path.sep)) throw AppError.notFound('File');
  return resolved;
}
