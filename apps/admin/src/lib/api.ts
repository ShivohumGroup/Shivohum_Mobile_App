import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
  updateAccessToken,
} from '@/lib/auth-storage';
import type { ApiErrorBody, AuthTokens } from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearAuthSession();
      return null;
    }
    const data = (await res.json()) as Partial<AuthTokens> & { accessToken: string };
    if (data.accessToken) {
      updateAccessToken(data.accessToken);
      if (data.refreshToken && data.user) {
        setAuthSession(data.accessToken, data.refreshToken, data.user);
      }
      return data.accessToken;
    }
    return null;
  } catch {
    clearAuthSession();
    return null;
  }
}

function ensureRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
  raw?: boolean;
};

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, auth = true, raw = false, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders);

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const doFetch = async () =>
    fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
      ...rest,
      headers,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });

  let res = await doFetch();

  if (res.status === 401 && auth) {
    const newToken = await ensureRefresh();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await doFetch();
    } else if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      clearAuthSession();
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      throw new ApiError(401, 'Session expired');
    }
  }

  if (raw) {
    if (!res.ok) {
      let message = res.statusText;
      try {
        const errBody = (await res.json()) as ApiErrorBody;
        message = Array.isArray(errBody.message)
          ? errBody.message.join(', ')
          : errBody.message || message;
        throw new ApiError(res.status, message, errBody);
      } catch (e) {
        if (e instanceof ApiError) throw e;
        throw new ApiError(res.status, message);
      }
    }
    return res as unknown as T;
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errBody = (isJson ? payload : { message: String(payload) }) as ApiErrorBody;
    const message = Array.isArray(errBody.message)
      ? errBody.message.join(', ')
      : errBody.message || res.statusText || 'Request failed';
    throw new ApiError(res.status, message, errBody);
  }

  return payload as T;
}

export function getApiBase() {
  return API_BASE;
}

/** Build authenticated download URL with token query fallback for new-tab exports */
export function exportUrl(path: string, params: Record<string, string | undefined> = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  const qs = q.toString();
  return `${API_BASE}${path}${qs ? `?${qs}` : ''}`;
}

export async function downloadAuthenticated(
  path: string,
  filename: string,
  params: Record<string, string | undefined> = {},
) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  const qs = q.toString();
  const res = await apiRequest<Response>(`${path}${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    raw: true,
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
