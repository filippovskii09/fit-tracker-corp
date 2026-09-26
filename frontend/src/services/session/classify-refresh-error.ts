import axios from 'axios';

import { REFRESH_ERROR_CODES } from '@constants';
import type { RefreshErrorCode, SessionOutcome } from '@types';

const isKnownRefreshErrorCode = (
  value: unknown,
): value is Exclude<RefreshErrorCode, 'UNKNOWN'> =>
  typeof value === 'string' &&
  (REFRESH_ERROR_CODES as readonly string[]).includes(value);

/**
 * Turns a refresh-call failure into a typed terminal/transient outcome
 * (design.md D5). Only a 401/403 clears the session — with
 * an allowed code as the specific terminal reason, or `UNKNOWN` (still
 * terminal, fail closed) when the code is missing/unrecognized. Every other
 * status (429, 5xx, and any other 4xx such as 400/404/405/408), and any
 * failure without an HTTP response (network error, timeout), is transient
 * and must not clear local session state.
 */
export const classifyRefreshError = (error: unknown): SessionOutcome => {
  if (!axios.isAxiosError(error)) {
    return { status: 'transient', reason: 'network' };
  }

  const status = error.response?.status;

  if (!status) {
    return { status: 'transient', reason: 'network' };
  }

  if (status === 429) {
    const retryAfterHeader = error.response?.headers?.['retry-after'];
    const bodyRetryAfter = (
      error.response?.data as { retryAfterSeconds?: unknown } | undefined
    )?.retryAfterSeconds;
    const retryAfterSeconds = Number(retryAfterHeader ?? bodyRetryAfter);

    return {
      status: 'transient',
      reason: 'rate_limited',
      retryAfterSeconds: Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds
        : undefined,
    };
  }

  if (status >= 500) {
    return { status: 'transient', reason: 'server_error' };
  }

  if (status === 401 || status === 403) {
    const code = (error.response?.data as { code?: unknown } | undefined)?.code;

    return {
      status: 'terminal',
      code: isKnownRefreshErrorCode(code) ? code : 'UNKNOWN',
    };
  }

  return { status: 'transient', reason: 'unexpected_status' };
};
