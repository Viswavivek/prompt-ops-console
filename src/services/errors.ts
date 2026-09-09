import axios from 'axios';
import type { ApiErrorCode, ApiErrorBody } from '@/types';

/** Normalized error thrown by every service function. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;

  constructor(params: {
    code: ApiErrorCode;
    message: string;
    status?: number;
    details?: Record<string, unknown>;
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
    this.requestId = params.requestId;
  }

  /** Field-level validation errors, if the backend provided them. */
  get fieldErrors(): Record<string, string> {
    const fields = this.details?.fields;
    if (Array.isArray(fields)) {
      return Object.fromEntries(fields.map((f) => [String(f), this.message]));
    }
    if (this.details?.field) {
      return { [String(this.details.field)]: this.message };
    }
    return {};
  }
}

const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
};

function codeFromStatus(status: number): ApiErrorCode {
  if (STATUS_TO_CODE[status]) return STATUS_TO_CODE[status];
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN_ERROR';
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorBody).error?.message === 'string'
  );
}

const DEFAULT_MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  NETWORK_ERROR: 'Could not reach the server. Check your connection and try again.',
  TIMEOUT: 'The request timed out. Please try again.',
  SERVER_ERROR: 'Something went wrong on the server.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: "You don't have access to this.",
  NOT_FOUND: 'The requested item could not be found.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  INVALID_RESPONSE: 'The server returned an unexpected response.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

/** Convert any thrown value (usually an AxiosError) into an ApiError. */
export function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') {
      return new ApiError({ code: 'TIMEOUT', message: DEFAULT_MESSAGES.TIMEOUT! });
    }
    if (err.response) {
      const { status, data } = err.response;
      const requestId =
        (err.response.headers?.['x-request-id'] as string | undefined) ?? undefined;

      if (isApiErrorBody(data)) {
        const rawCode = data.error.code as ApiErrorCode;
        const code: ApiErrorCode = rawCode || codeFromStatus(status);
        return new ApiError({
          code,
          message: data.error.message,
          status,
          details: data.error.details,
          requestId: data.error.requestId ?? requestId,
        });
      }

      // Non-standard body: string, { message }, or unparseable.
      let message: string | undefined;
      if (typeof data === 'string') message = data;
      else if (data && typeof data === 'object' && 'message' in data) {
        message = String((data as { message: unknown }).message);
      }
      const code = codeFromStatus(status);
      return new ApiError({
        code,
        message: message || DEFAULT_MESSAGES[code] || `Request failed (${status}).`,
        status,
        requestId,
      });
    }
    // No response: network failure / CORS / DNS.
    return new ApiError({ code: 'NETWORK_ERROR', message: DEFAULT_MESSAGES.NETWORK_ERROR! });
  }

  return new ApiError({
    code: 'UNKNOWN_ERROR',
    message: err instanceof Error ? err.message : DEFAULT_MESSAGES.UNKNOWN_ERROR!,
  });
}

/** Guard for use in `catch` blocks and React error rendering. */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
