import axios from 'axios';

import { config } from '@config';
import {
  ACCESS_TOKEN_REFRESH_WINDOW_SECONDS,
  ACCESS_TOKEN_STORAGE_KEY,
  API_ENDPOINTS,
  APP_ROUTES,
  AUTH_REFRESH_BACKOFF_BASE_MS,
  AUTH_REFRESH_BACKOFF_CAP_MS,
  AUTH_REFRESH_BACKOFF_JITTER_RATIO,
  AUTH_REFRESH_WAIT_TIMEOUT_MS,
  AUTH_REQUEST_TIMEOUT_MS,
} from '@constants';
import type { RefreshSuccessResponse, SessionOutcome } from '@types';
import {
  clearCachedWorkouts,
  clearWorkoutDraftsForUser,
  getAccessTokenUserId,
  isAccessTokenExpiring,
  redirectTo,
  storeReturnTo,
} from '@utils';
import { notifyAuthStoreChanged } from './auth-store';
import { classifyRefreshError } from './classify-refresh-error';
import {
  acquireRefreshLease,
  broadcastLogout,
  broadcastRefreshOutcome,
  clearCrossTabRefreshState,
  subscribeToLogoutBroadcast,
  waitForRefreshOutcome,
} from './cross-tab-refresh';

// Bare client for the refresh/logout calls themselves: it must never go
// through the shared `api` interceptor (which depends on this module),
// keeping the coordinator the single owner of refresh state (design.md D4,
// task 6.1). A timeout well inside the lease TTL means a
// stalled request can never hold the cross-tab lease past its own bound.
const authClient = axios.create({
  baseURL: config.api.baseURL,
  withCredentials: true,
  timeout: AUTH_REQUEST_TIMEOUT_MS,
});

let inFlightRefresh: Promise<SessionOutcome> | null = null;

// Transient-outcome backoff state: shared across
// in-tab callers so a burst of proactive checks during an outage collapses
// into the same cached outcome instead of hammering the endpoint.
let nextAllowedRefreshAtMs = 0;
let consecutiveTransientFailures = 0;
let cachedTransientOutcome: Extract<
  SessionOutcome,
  { status: 'transient' }
> | null = null;
// True only while the active backoff window came from a server-mandated
// `Retry-After` (429), as opposed to this tab's own exponential backoff — an
// explicit user retry may bypass the latter but must still honor the former.
let cachedTransientIsServerEnforced = false;

// Session generation/epoch: bumped on every logout so an
// in-flight refresh started before it can never write a token or broadcast
// a result that a since-logged-out tab would otherwise adopt.
let sessionGeneration = 0;

export const getAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

const setAccessToken = (accessToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  notifyAuthStoreChanged();
};

const clearAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  notifyAuthStoreChanged();
};

const resetBackoff = (): void => {
  nextAllowedRefreshAtMs = 0;
  consecutiveTransientFailures = 0;
  cachedTransientOutcome = null;
  cachedTransientIsServerEnforced = false;
};

/**
 * Test-only escape hatch: this module holds shared, mutable backoff state
 * across every caller in the tab by design, so tests that induce a
 * transient outcome must reset it explicitly instead of leaking backoff
 * across unrelated test cases.
 */
export const __resetSessionCoordinatorStateForTests = (): void => {
  inFlightRefresh = null;
  sessionGeneration = 0;
  resetBackoff();
};

const registerTransientOutcome = (
  outcome: Extract<SessionOutcome, { status: 'transient' }>,
): void => {
  consecutiveTransientFailures += 1;

  const serverEnforced =
    typeof outcome.retryAfterSeconds === 'number' &&
    outcome.retryAfterSeconds > 0;

  let delayMs: number;
  if (serverEnforced) {
    delayMs = outcome.retryAfterSeconds! * 1000;
  } else {
    const exponent = Math.min(consecutiveTransientFailures - 1, 10);
    const raw = AUTH_REFRESH_BACKOFF_BASE_MS * 2 ** exponent;
    const capped = Math.min(raw, AUTH_REFRESH_BACKOFF_CAP_MS);
    const jitter = capped * AUTH_REFRESH_BACKOFF_JITTER_RATIO * Math.random();
    delayMs = Math.round(capped + jitter);
  }

  nextAllowedRefreshAtMs = Date.now() + delayMs;
  cachedTransientOutcome = outcome;
  cachedTransientIsServerEnforced = serverEnforced;
};

const performRefresh = async (): Promise<SessionOutcome> => {
  try {
    const { data } = await authClient.post<RefreshSuccessResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
    );

    // A 200 with a missing/empty accessToken is a malformed success body —
    // treated as transient rather than trusted or fatal.
    if (!data || typeof data.accessToken !== 'string' || !data.accessToken) {
      return { status: 'transient', reason: 'unexpected_status' };
    }

    return { status: 'success', accessToken: data.accessToken };
  } catch (error) {
    return classifyRefreshError(error);
  }
};

const finalizeOutcome = (outcome: SessionOutcome): SessionOutcome => {
  if (outcome.status === 'transient') {
    registerTransientOutcome(outcome);
  } else {
    resetBackoff();
  }
  return outcome;
};

/**
 * Performs the network refresh as the lease owner, applying the result only
 * if the session generation hasn't moved on (an explicit logout) while the
 * request was in flight: a stale-generation outcome is never written to
 * storage and never broadcast to other tabs.
 *
 * `startGeneration` is always the value captured once at `coordinateRefresh`
 * entry, passed down explicitly — never re-read from module state inside
 * this function — so an owned attempt and a later recovery attempt for the
 * *same* logical call agree on which generation they belong to, even if a
 * logout bumps the counter while this call was waiting to acquire the lease.
 */
const performOwnedRefresh = async (
  startGeneration: number,
): Promise<SessionOutcome> => {
  const rawOutcome = await performRefresh();

  if (sessionGeneration !== startGeneration) {
    // A logout happened while this refresh was in flight: this outcome
    // belongs to a session that no longer exists in this tab.
    return { status: 'transient', reason: 'network' };
  }

  const outcome = finalizeOutcome(rawOutcome);
  if (outcome.status === 'success') {
    setAccessToken(outcome.accessToken);
  }
  broadcastRefreshOutcome(outcome);
  return outcome;
};

export interface RefreshOptions {
  /**
   * Skips this tab's own exponential backoff window (an explicit,
   * user-initiated retry) — but never a server-mandated `Retry-After`
   * (429): that one is still honored so an impatient retry click can't
   * turn into hammering an endpoint that already asked to be left alone.
   */
  bypassBackoff?: boolean;
}

/**
 * Typed single-flight refresh, shared by the response interceptor and every
 * proactive expiry check (task 6.1). In-tab callers share one promise; across
 * tabs, only the lease holder calls the network and every other tab awaits
 * the broadcast result (task 6.3). While a transient backoff window is
 * active, callers get the cached outcome without a new network call.
 */
export const coordinateRefresh = async (
  options: RefreshOptions = {},
): Promise<SessionOutcome> => {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  const backoffActive =
    !!cachedTransientOutcome && Date.now() < nextAllowedRefreshAtMs;
  const mustHonorBackoff =
    backoffActive &&
    (!options.bypassBackoff || cachedTransientIsServerEnforced);

  if (mustHonorBackoff) {
    // A server-mandated `Retry-After` that's still active: report the
    // *remaining* seconds, not the value cached at registration time — an
    // impatient retry mid-countdown must never make the visible countdown
    // jump back up to the original duration.
    return cachedTransientIsServerEnforced
      ? {
          ...cachedTransientOutcome!,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((nextAllowedRefreshAtMs - Date.now()) / 1000),
          ),
        }
      : cachedTransientOutcome!;
  }

  // Captured exactly once, at entry, and threaded through every attempt this
  // call makes (owned or recovery) — never re-read from module state inside
  // an attempt, so a logout that bumps the generation mid-flight is judged
  // consistently against the generation this call actually started with.
  const startGeneration = sessionGeneration;

  inFlightRefresh = (async () => {
    try {
      const ownedAttempt = await acquireRefreshLease(() =>
        performOwnedRefresh(startGeneration),
      );
      if (ownedAttempt.acquired) {
        return ownedAttempt.value;
      }

      const winnerOutcome = await waitForRefreshOutcome(
        AUTH_REFRESH_WAIT_TIMEOUT_MS,
      );
      if (winnerOutcome) {
        if (sessionGeneration !== startGeneration) {
          // An explicit logout happened while this call was waiting for the
          // lease holder's result: that outcome — success or not — belongs
          // to a session that no longer exists in this tab. Reporting it as
          // transient (rather than the winner's real status) keeps every
          // caller's contract intact: the interceptor never replays the
          // original request with a pre-logout token, and the bootstrap
          // hook never renders authenticated for it.
          return { status: 'transient', reason: 'network' };
        }
        if (winnerOutcome.status === 'success') {
          setAccessToken(winnerOutcome.accessToken);
        }
        return finalizeOutcome(winnerOutcome);
      }

      // The lease holder never broadcast (crashed tab, closed tab, lost
      // message): try to become the owner ourselves.
      const recoveryAttempt = await acquireRefreshLease(() =>
        performOwnedRefresh(startGeneration),
      );
      if (recoveryAttempt.acquired) {
        return recoveryAttempt.value;
      }

      return finalizeOutcome({ status: 'transient', reason: 'network' });
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
};

/**
 * Clears local session state after a confirmed terminal failure only
 * (design.md D5): the access token and cached list data are removed, the
 * current route is preserved as a sanitized `returnTo` — bound to the
 * expiring user when one is known, or left unbound for a fully anonymous
 * visit with no decodable token (orchestrator decision) so any subsequent
 * sign-in can still land back on it — and any workout draft is left
 * untouched (design.md D6) so it survives reauthentication. Revoking the
 * session server-side is best-effort — the contract's `/auth/logout` is
 * idempotent and safe even if the session is already gone.
 */
export const handleTerminalSessionFailure = (): void => {
  // The userId must be read from the token being cleared, before it's gone.
  const expiringUserId = getAccessTokenUserId(getAccessToken());

  clearAccessToken();
  clearCachedWorkouts();

  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (currentPath && currentPath !== APP_ROUTES.AUTH.SIGNIN) {
    storeReturnTo(currentPath, expiringUserId);
  }

  void authClient.post(API_ENDPOINTS.AUTH.LOGOUT).catch(() => {
    // Best-effort revoke; the client-side session is already cleared.
  });

  redirectTo(APP_ROUTES.AUTH.SIGNIN);
};

/** Clears state owned by this module without the network call or redirect. */
const clearLocalSessionState = (): void => {
  clearAccessToken();
  clearCachedWorkouts();
  clearCrossTabRefreshState();
  resetBackoff();
};

/**
 * Explicit logout, for any current or future user-triggered sign-out. Bumps
 * the session generation so a refresh already in flight can never resurrect
 * this session, and broadcasts a `logged_out` event so every other tab
 * clears its own session and returns to sign-in regardless of what its own
 * in-flight refresh resolves to. This function also clears this user's local
 * workout drafts (explicit logout only — a terminal session expiry never
 * does).
 */
export const logout = async (): Promise<void> => {
  const loggingOutUserId = getAccessTokenUserId(getAccessToken());
  // Bumped once immediately, to invalidate anything already in flight from
  // before this call, and again after the local state is actually cleared
  // below: a refresh that started *during* the network await captures this
  // first bump as its own "current" generation and would otherwise pass its
  // own consistency check and resurrect the session right after logout.
  sessionGeneration += 1;

  try {
    await authClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  } catch {
    // The contract's logout is best-effort from the client's perspective:
    // local state is cleared either way.
  } finally {
    clearLocalSessionState();
    sessionGeneration += 1;
    if (loggingOutUserId) {
      clearWorkoutDraftsForUser(loggingOutUserId);
    }
    broadcastLogout();
    redirectTo(APP_ROUTES.AUTH.SIGNIN);
  }
};

// Applied once per tab, at module load: another tab's explicit logout must
// clear this tab's session immediately, even if a refresh started here
// before the logout is still in flight.
subscribeToLogoutBroadcast(() => {
  sessionGeneration += 1;
  clearLocalSessionState();
  redirectTo(APP_ROUTES.AUTH.SIGNIN);
});

/**
 * Refreshes when the access token is missing/expired/near expiry (task 6.2).
 * Used on app start, focus/reconnect, and before a critical mutation such as
 * workout creation.
 */
export const ensureFreshAccessToken = async (
  options?: RefreshOptions,
): Promise<SessionOutcome> => {
  const token = getAccessToken();

  if (
    token &&
    !isAccessTokenExpiring(token, ACCESS_TOKEN_REFRESH_WINDOW_SECONDS)
  ) {
    return { status: 'success', accessToken: token };
  }

  return coordinateRefresh(options);
};
