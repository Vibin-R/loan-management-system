import type { ApiErrorBody, ApiSuccess, FieldError } from './types';
import { tokenStore } from './token';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

/** An error returned by the API, with the server's code, message and optional details. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Field-level validation errors (400 VALIDATION_ERROR) as a `{ field: message }` map. */
  get fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.details)) return {};
    return Object.fromEntries(
      (this.details as FieldError[])
        .filter((d) => typeof d?.field === 'string')
        .map((d) => [d.field, d.message]),
    );
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  query?: Query;
  /** JSON-serialisable body, or FormData for file uploads. */
  body?: unknown;
  signal?: AbortSignal;
}

/** Called when any request returns 401, e.g. to clear auth state and redirect to /login. */
let onUnauthenticated: (() => void) | null = null;
export const setUnauthenticatedHandler = (handler: () => void) => {
  onUnauthenticated = handler;
};

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body; // the browser sets the multipart boundary itself
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Could not reach the server. Check your connection and try again.',
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, payload, path);
  return (payload as ApiSuccess<T>).data;
}

/** Turns an error response into an ApiError, signing the user out on 401. */
function toApiError(status: number, payload: unknown, path: string): ApiError {
  const error = (payload as ApiErrorBody | null)?.error;
  if (status === 401 && !path.startsWith('/auth/')) onUnauthenticated?.();
  return new ApiError(
    status,
    error?.code ?? 'UNKNOWN_ERROR',
    error?.message ?? 'Something went wrong. Please try again.',
    error?.details,
  );
}

/**
 * Multipart upload with progress (0–100). Uses XMLHttpRequest because fetch can't report
 * upload progress.
 */
function upload<T>(
  path: string,
  form: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', buildUrl(path));
    xhr.setRequestHeader('Accept', 'application/json');
    const token = tokenStore.get();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () =>
      reject(
        new ApiError(0, 'NETWORK_ERROR', 'Upload failed. Check your connection and try again.'),
      );
    xhr.onload = () => {
      let payload: unknown = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON response; handled as an unknown error below.
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve((payload as ApiSuccess<T>).data);
      else reject(toApiError(xhr.status, payload, path));
    };
    xhr.send(form);
  });
}

/** Downloads a protected file (e.g. a salary slip) as a Blob, with the auth header attached. */
async function getBlob(path: string): Promise<Blob> {
  const token = tokenStore.get();
  const response = await fetch(buildUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Try again.');
  });
  if (!response.ok) {
    throw toApiError(response.status, await response.json().catch(() => null), path);
  }
  return response.blob();
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
  upload,
  getBlob,
};
