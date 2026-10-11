import multer from 'multer';
import { env } from '../config/env';

/**
 * Accepts a single file in memory, up to MAX_UPLOAD_MB. Content checks (real file type)
 * happen in the service, because the browser-supplied MIME type can't be trusted.
 * A too-large file becomes 413 in the error handler.
 */
export const singleFileUpload = (fieldName: string) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  }).single(fieldName);
