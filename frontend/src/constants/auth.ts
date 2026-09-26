// Session coordinator tuning (design.md D4/D5). Kept as
// constants so tests and call sites share one source of truth instead of
// scattering magic numbers.

// Proactive refresh window: refresh when the access token is expired or
// within this many seconds of expiry (task 6.2).
export const ACCESS_TOKEN_REFRESH_WINDOW_SECONDS = 60;

// Cross-tab refresh ownership (task 6.3).
export const AUTH_BROADCAST_CHANNEL_NAME = 'fit-tracker:auth-session';
export const AUTH_REFRESH_LEASE_KEY = 'fit-tracker:auth:refresh-lease';
export const AUTH_REFRESH_RESULT_KEY = 'fit-tracker:auth:refresh-result';
export const AUTH_REFRESH_LEASE_TTL_MS = 8000;
export const AUTH_REFRESH_WAIT_TIMEOUT_MS = 10000;
// A persisted refresh outcome older than this is treated as stale noise
// rather than something a fresh waiter should adopt immediately.
export const AUTH_REFRESH_RESULT_FRESHNESS_MS = AUTH_REFRESH_WAIT_TIMEOUT_MS;

// Explicit-logout cross-tab broadcast.
export const AUTH_LOGOUT_BROADCAST_KEY = 'fit-tracker:auth:logout';

// The refresh/logout network call must resolve well inside the lease TTL so
// a slow request can't hold a lease past its own bound.
export const AUTH_REQUEST_TIMEOUT_MS = 6000;

// Transient-refresh backoff: honor `retryAfterSeconds`
// when the backend provides one (429); otherwise back off exponentially,
// capped and jittered, so repeated proactive/interceptor calls during an
// outage don't hammer the refresh endpoint.
export const AUTH_REFRESH_BACKOFF_BASE_MS = 1000;
export const AUTH_REFRESH_BACKOFF_CAP_MS = 30000;
export const AUTH_REFRESH_BACKOFF_JITTER_RATIO = 0.2;

// Sanitized internal return-to route preserved across a terminal session
// expiry (task 6.6), bound to the user whose session just failed and
// bounded in time so a much-later sign-in doesn't restore a stale route.
export const AUTH_RETURN_TO_KEY = 'fit-tracker:auth:return-to';
export const AUTH_RETURN_TO_TTL_MS = 30 * 60 * 1000;

export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

// Structured terminal refresh reason codes the backend may return. Anything
// outside this set on a 401/403 is treated as a malformed terminal failure
// and still fails closed.
export const REFRESH_ERROR_CODES = [
  'REFRESH_COOKIE_MISSING',
  'REFRESH_TOKEN_EXPIRED',
  'REFRESH_TOKEN_INVALID',
  'SESSION_NOT_FOUND',
  'SESSION_REVOKED',
  'SESSION_EXPIRED',
  'REFRESH_REPLAYED',
] as const;
