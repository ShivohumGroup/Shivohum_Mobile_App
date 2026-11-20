import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/auth/tokenStorage';
import type { ApiErrorBody, LoginResponse } from '@/types/api';
import { getApiBaseUrl } from '@/api/apiUrl';

export { getApiBaseUrl } from '@/api/apiUrl';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: string | string[];

  constructor(status: number, message: string, code?: string, details?: string | string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  headers?: Record<string, string>;
  formData?: FormData;
  signal?: AbortSignal;
};

let refreshPromise: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalized}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;
      try {
        const res = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          await clearTokens();
          return null;
        }
        const data = (await res.json()) as LoginResponse | { accessToken: string; refreshToken: string };
        await setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      } catch {
        await clearTokens();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || 'Request failed';
  let code: string | undefined;
  let details: string | string[] | undefined;
  try {
    const body = (await res.json()) as ApiErrorBody;
    details = body.message;
    code = body.code;
    message = Array.isArray(body.message) ? body.message.join(', ') : body.message || message;
  } catch {
    // ignore non-JSON
  }
  return new ApiError(res.status, message, code, details);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, headers = {}, formData, signal } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (!formData && body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const doFetch = () =>
    fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: formData ? formData : body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

  let res = await doFetch();

  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      finalHeaders.Authorization = `Bearer ${newToken}`;
      res = await doFetch();
    } else {
      onUnauthorized?.();
      throw new ApiError(401, 'Session expired. Please sign in again.', 'UNAUTHORIZED');
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      onUnauthorized?.();
    }
    throw await parseError(res);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], auth = true) =>
    apiRequest<T>(path, { method: 'GET', query, auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'PATCH', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'PUT', body, auth }),
  delete: <T>(path: string, auth = true) => apiRequest<T>(path, { method: 'DELETE', auth }),
  upload: <T>(path: string, formData: FormData) =>
    apiRequest<T>(path, { method: 'POST', formData }),
};
