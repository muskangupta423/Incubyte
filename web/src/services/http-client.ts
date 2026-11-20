import type { ApiErrorDetail, ApiErrorResponse } from '@acme/shared';

/** Where the API lives. Same origin by default (Vite proxies /api in development). */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** An API failure with a message that is safe to show to the user. */
export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status, or 0 when the server could not be reached at all. */
    readonly status: number,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | undefined;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * The single place the app talks to the API: builds the URL, sends JSON and
 * turns every failure into an ApiError with a user-friendly message.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal: signal ?? null,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? null : JSON.stringify(body),
    });
  } catch (error) {
    // A cancelled request (e.g. the user typed again) is not an error worth showing.
    if (signal?.aborted) throw error;
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  // Responses come from our own API, typed by the shared contracts in @acme/shared.
  return (await response.json()) as T;
}

function buildUrl(path: string, query: Record<string, QueryValue> = {}): string {
  // An absolute URL (based on the current page) works in the browser and in tests.
  const url = new URL(`${API_BASE_URL}/api${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function toApiError(response: Response): Promise<ApiError> {
  const fallbackMessage = 'Something went wrong. Please try again.';
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>;
    return new ApiError(
      body.error?.message ?? fallbackMessage,
      response.status,
      body.error?.details,
    );
  } catch {
    // Not JSON (e.g. a proxy error page): fall back to a generic message.
    return new ApiError(fallbackMessage, response.status);
  }
}
