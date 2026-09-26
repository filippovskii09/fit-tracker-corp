import { useCallback, useEffect, useRef, useState } from 'react';

import { ACCESS_TOKEN_REFRESH_WINDOW_SECONDS } from '@constants';
import {
  ensureFreshAccessToken,
  getAccessToken,
  handleTerminalSessionFailure,
  useAuthSession,
  type RefreshOptions,
} from '@services/session';
import { getAccessTokenUserId, isAccessTokenExpiring } from '@utils';

export type SessionBootstrapStatus =
  | 'checking'
  | 'authenticated'
  | 'anonymous'
  | 'transient';

export interface SessionBootstrap {
  status: SessionBootstrapStatus;
  /** Re-runs the bootstrap check; the only way out of `'transient'`. */
  retry: () => void;
  /**
   * Seconds remaining on an active server-mandated `Retry-After` (429), or
   * `null` when there is none — `retry()` still honors this even though it
   * bypasses this tab's own exponential backoff.
   */
  retryAfterSeconds: number | null;
}

const computeInitialStatus = (): SessionBootstrapStatus => {
  const token = getAccessToken();
  return token &&
    !isAccessTokenExpiring(token, ACCESS_TOKEN_REFRESH_WINDOW_SECONDS)
    ? 'authenticated'
    : 'checking';
};

/**
 * Drives the private-route bootstrap decision: with no or
 * an expiring access token this runs one coordinated refresh before
 * deciding anything, so a valid refresh cookie can restore the session
 * instead of the guard redirecting to sign-in before ever trying. A
 * terminal outcome ends the session and returns to sign-in; a transient
 * outcome (network/429/5xx) never redirects or clears auth — the caller
 * renders an accessible retry affordance instead.
 *
 * Also keeps refreshing in the background on focus/reconnect for an
 * already-authenticated tab (task 6.2): a background probe never disturbs
 * the rendered status unless the outcome is terminal, and a *successful*
 * probe recovers a previously `transient` status back to `authenticated`.
 *
 * Reacts to the reactive identity (`sub`) changing underneath an already
 * decided status — another tab's terminal expiry/logout, or a sign-in as a
 * different user, observed via `storage` — by re-running the whole
 * bootstrap. The guard must never keep rendering the protected content for
 * an identity that no longer matches what was last verified. If the identity
 * moves on again *while* an attempt is already in flight, the attempt
 * re-runs itself once more as soon as it settles, instead of leaving the
 * page stuck on a masked `checking` render forever.
 */
export const useSessionRefresh = (): SessionBootstrap => {
  const { sub } = useAuthSession();
  const [status, setStatus] =
    useState<SessionBootstrapStatus>(computeInitialStatus);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(
    null,
  );
  const statusRef = useRef(status);
  statusRef.current = status;
  // The identity the current `status` decision was actually based on.
  const bootstrapSubRef = useRef<string | null>(sub);
  // The identity as of the most recent render — read from `finally` below,
  // since a `useEffect` closure over `sub` can be stale for the whole
  // lifetime of an in-flight attempt it declined to react to.
  const latestSubRef = useRef(sub);
  latestSubRef.current = sub;
  // Guards against the sub-change effect and the background probe both
  // deciding, concurrently, that a refresh is due (e.g. this tab's own
  // successful refresh writes a new token, which is itself an identity
  // "change" the other effect would otherwise react to) — only one
  // in-flight attempt drives `status` at a time.
  const refreshInFlightRef = useRef(false);

  // Always points at the current `runBootstrap` so `finally` below can
  // trigger another attempt without a use-before-define self-reference.
  const runBootstrapRef = useRef<(options?: RefreshOptions) => Promise<void>>(
    () => Promise.resolve(),
  );

  const runBootstrap = useCallback(async (options?: RefreshOptions) => {
    refreshInFlightRef.current = true;
    setStatus('checking');
    // Only an attempt that lands on `authenticated` can ever be masked by
    // `effectiveStatus` below for a since-diverged identity — `anonymous`/
    // `transient` are rendered as-is regardless of `sub`, so re-running for
    // those would risk looping forever against a mocked/unreactive identity
    // instead of ever converging.
    let endedAuthenticated = false;
    try {
      const outcome = await ensureFreshAccessToken(options);

      if (outcome.status === 'success') {
        bootstrapSubRef.current = getAccessTokenUserId(outcome.accessToken);
        setRetryAfterSeconds(null);
        setStatus('authenticated');
        endedAuthenticated = true;
        return;
      }
      if (outcome.status === 'terminal') {
        handleTerminalSessionFailure();
        bootstrapSubRef.current = null;
        setRetryAfterSeconds(null);
        setStatus('anonymous');
        return;
      }
      setRetryAfterSeconds(
        typeof outcome.retryAfterSeconds === 'number' &&
          outcome.retryAfterSeconds > 0
          ? Math.ceil(outcome.retryAfterSeconds)
          : null,
      );
      setStatus('transient');
    } finally {
      refreshInFlightRef.current = false;
      // Re-runs once more if the reactive identity moved on again while this
      // attempt was in flight: the sub-change effect below bails out
      // whenever one is already running, so without this, an attempt that
      // settles `authenticated` for an identity `sub` has since left behind
      // would otherwise never be revisited — the guard would keep
      // `effectiveStatus` masked to `checking` forever instead of ever
      // finishing (a permanently blank page), since nothing else is left to
      // trigger a further attempt.
      if (
        endedAuthenticated &&
        latestSubRef.current !== bootstrapSubRef.current
      ) {
        void runBootstrapRef.current();
      }
    }
  }, []);
  runBootstrapRef.current = runBootstrap;

  // An explicit, user-initiated retry may skip this tab's own exponential
  // backoff — it must never be blocked by the app's own caution — but a
  // server-mandated `Retry-After` is still honored by `coordinateRefresh`
  // itself regardless of this flag.
  const retry = useCallback(() => {
    void runBootstrap({ bypassBackoff: true });
  }, [runBootstrap]);

  useEffect(() => {
    if (computeInitialStatus() === 'checking') {
      void runBootstrap();
    }
    // Runs once, only for the initial mount decision; `retry`, the sub-change
    // effect below, and the background probe drive every later attempt
    // explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sub === bootstrapSubRef.current || refreshInFlightRef.current) {
      return;
    }
    // The reactive identity moved on from what the last completed bootstrap
    // verified (another tab's logout/terminal expiry, or a different user
    // signing in) — re-verify from scratch instead of trusting a stale
    // `authenticated` status.
    void runBootstrap();
  }, [sub, runBootstrap]);

  useEffect(() => {
    const runBackgroundProbe = async () => {
      if (refreshInFlightRef.current) {
        return;
      }
      refreshInFlightRef.current = true;
      let endedAuthenticated = false;
      try {
        const outcome = await ensureFreshAccessToken();
        if (outcome.status === 'terminal') {
          handleTerminalSessionFailure();
          bootstrapSubRef.current = null;
          setRetryAfterSeconds(null);
          setStatus('anonymous');
          return;
        }
        if (outcome.status === 'success' && statusRef.current === 'transient') {
          // A previously failed connectivity/backend probe has recovered:
          // reflect it instead of leaving the retry screen up forever.
          bootstrapSubRef.current = getAccessTokenUserId(outcome.accessToken);
          setRetryAfterSeconds(null);
          setStatus('authenticated');
          endedAuthenticated = true;
        }
        // Otherwise: silent background probe, no visible state change.
      } finally {
        refreshInFlightRef.current = false;
        if (
          endedAuthenticated &&
          latestSubRef.current !== bootstrapSubRef.current
        ) {
          void runBootstrapRef.current();
        }
      }
    };

    const handleFocus = () => {
      void runBackgroundProbe();
    };
    const handleOnline = () => {
      void runBackgroundProbe();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Ticks the displayed Retry-After countdown down to zero once per second;
  // self-scheduling so it stops naturally once nothing is left to count.
  useEffect(() => {
    if (!retryAfterSeconds || retryAfterSeconds <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setRetryAfterSeconds((previous) =>
        previous === null ? null : Math.max(0, previous - 1),
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [retryAfterSeconds]);

  // Never render as authenticated for a stale/mismatched identity (the
  // guard must never show protected content without one): if the reactive
  // `sub` has already moved on from what `status` was last decided for,
  // treat this render as `checking` even before the sub-change effect above
  // has had a chance to run.
  const effectiveStatus: SessionBootstrapStatus =
    status === 'authenticated' && sub !== bootstrapSubRef.current
      ? 'checking'
      : status;

  return { status: effectiveStatus, retry, retryAfterSeconds };
};
