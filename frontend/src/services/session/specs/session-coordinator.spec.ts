const mockPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({ post: mockPost })),
  },
}));

jest.mock('@config', () => ({
  config: { api: { baseURL: 'http://test-api.com' } },
}));

jest.mock('@utils', () => ({
  ...jest.requireActual('@utils'),
  redirectTo: jest.fn(),
  clearCachedWorkouts: jest.fn(),
  clearWorkoutDraftsForUser: jest.fn(),
  storeReturnTo: jest.fn(),
}));

jest.mock('../classify-refresh-error', () => ({
  classifyRefreshError: jest.fn(),
}));

jest.mock('../cross-tab-refresh', () => ({
  acquireRefreshLease: jest.fn(),
  tryAcquireRefreshLease: jest.fn(),
  releaseRefreshLease: jest.fn(),
  broadcastRefreshOutcome: jest.fn(),
  waitForRefreshOutcome: jest.fn(),
  clearCrossTabRefreshState: jest.fn(),
  broadcastLogout: jest.fn(),
  subscribeToLogoutBroadcast: jest.fn(() => () => {}),
}));

import axios from 'axios';

import {
  APP_ROUTES,
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_REFRESH_BACKOFF_CAP_MS,
  AUTH_REFRESH_LEASE_TTL_MS,
  AUTH_REQUEST_TIMEOUT_MS,
  AUTH_RETURN_TO_KEY,
} from '@constants';
import {
  clearCachedWorkouts,
  clearWorkoutDraftsForUser,
  readWorkoutDraft,
  redirectTo,
  storeReturnTo,
  writeWorkoutDraft,
} from '@utils';
import { classifyRefreshError } from '../classify-refresh-error';
import {
  acquireRefreshLease,
  broadcastLogout,
  broadcastRefreshOutcome,
  clearCrossTabRefreshState,
  subscribeToLogoutBroadcast,
  waitForRefreshOutcome,
} from '../cross-tab-refresh';
import {
  __resetSessionCoordinatorStateForTests,
  coordinateRefresh,
  ensureFreshAccessToken,
  getAccessToken,
  handleTerminalSessionFailure,
  logout,
} from '../session-coordinator';

// Captured once, at module-eval time, before any `beforeEach` clears mocks.
const axiosCreateCallArgs = (axios.create as jest.Mock).mock.calls[0]?.[0];
const onCrossTabLogout = (subscribeToLogoutBroadcast as jest.Mock).mock
  .calls[0]?.[0];

const tokenFor = (userId: string): string =>
  `h.${btoa(JSON.stringify({ sub: userId, exp: 9999999999 }))}.s`;

const mockedAcquireLease = acquireRefreshLease as jest.Mock;
const mockedBroadcast = broadcastRefreshOutcome as jest.Mock;
const mockedWaitForOutcome = waitForRefreshOutcome as jest.Mock;
const mockedClearCrossTabRefreshState = clearCrossTabRefreshState as jest.Mock;
const mockedBroadcastLogout = broadcastLogout as jest.Mock;
const mockedClassify = classifyRefreshError as jest.Mock;
const mockedRedirectTo = redirectTo as jest.Mock;
const mockedClearCachedWorkouts = clearCachedWorkouts as jest.Mock;
const mockedClearWorkoutDraftsForUser = clearWorkoutDraftsForUser as jest.Mock;
const mockedStoreReturnTo = storeReturnTo as jest.Mock;

describe('session-coordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockedAcquireLease.mockImplementation(async (ownerFn: () => unknown) => ({
      acquired: true,
      value: await ownerFn(),
    }));
    __resetSessionCoordinatorStateForTests();
  });

  it('configures the auth client with a timeout below the lease TTL', () => {
    expect(AUTH_REQUEST_TIMEOUT_MS).toBeLessThan(AUTH_REFRESH_LEASE_TTL_MS);
    expect(axiosCreateCallArgs).toMatchObject({
      timeout: AUTH_REQUEST_TIMEOUT_MS,
    });
  });

  describe('coordinateRefresh', () => {
    it('performs the refresh itself, stores the token, and broadcasts on lease acquisition', async () => {
      mockPost.mockResolvedValue({ data: { accessToken: 'fresh-token' } });

      const outcome = await coordinateRefresh();

      expect(outcome).toEqual({
        status: 'success',
        accessToken: 'fresh-token',
      });
      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe(
        'fresh-token',
      );
      expect(mockedBroadcast).toHaveBeenCalledWith(outcome);
    });

    it('returns a classified outcome when the refresh call rejects', async () => {
      mockPost.mockRejectedValue(new Error('boom'));
      mockedClassify.mockReturnValue({
        status: 'terminal',
        code: 'SESSION_REVOKED',
      });

      const outcome = await coordinateRefresh();

      expect(outcome).toEqual({ status: 'terminal', code: 'SESSION_REVOKED' });
      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
      expect(mockedBroadcast).toHaveBeenCalledWith(outcome);
    });

    it('treats a 200 response with a missing/empty accessToken as transient', async () => {
      mockPost.mockResolvedValue({ data: { accessToken: '' } });

      const outcome = await coordinateRefresh();

      expect(outcome).toEqual({
        status: 'transient',
        reason: 'unexpected_status',
      });
      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    });

    it('treats a 200 response with no body as transient', async () => {
      mockPost.mockResolvedValue({ data: undefined });

      const outcome = await coordinateRefresh();

      expect(outcome).toEqual({
        status: 'transient',
        reason: 'unexpected_status',
      });
    });

    it('single-flights concurrent in-tab callers into one lease attempt', async () => {
      let resolvePost!: (value: { data: { accessToken: string } }) => void;
      mockPost.mockReturnValue(
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
      );

      const first = coordinateRefresh();
      const second = coordinateRefresh();

      expect(mockedAcquireLease).toHaveBeenCalledTimes(1);

      resolvePost({ data: { accessToken: 'shared-token' } });

      await expect(first).resolves.toEqual(await second);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('waits for the winning tab when it does not hold the lease', async () => {
      mockedAcquireLease.mockResolvedValueOnce({ acquired: false });
      mockedWaitForOutcome.mockResolvedValue({
        status: 'success',
        accessToken: 'from-other-tab',
      });

      const outcome = await coordinateRefresh();

      expect(mockPost).not.toHaveBeenCalled();
      expect(outcome).toEqual({
        status: 'success',
        accessToken: 'from-other-tab',
      });
      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe(
        'from-other-tab',
      );
    });

    it('recovers by performing the refresh itself if the owning tab never broadcasts', async () => {
      mockedAcquireLease
        .mockResolvedValueOnce({ acquired: false })
        .mockImplementationOnce(async (ownerFn: () => unknown) => ({
          acquired: true,
          value: await ownerFn(),
        }));
      mockedWaitForOutcome.mockResolvedValue(null);
      mockPost.mockResolvedValue({ data: { accessToken: 'recovered-token' } });

      const outcome = await coordinateRefresh();

      expect(outcome).toEqual({
        status: 'success',
        accessToken: 'recovered-token',
      });
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('resolves transient/network without a network call when the lease stays held and no outcome ever arrives', async () => {
      mockedAcquireLease.mockResolvedValue({ acquired: false });
      mockedWaitForOutcome.mockResolvedValue(null);

      const outcome = await coordinateRefresh();

      expect(outcome).toEqual({ status: 'transient', reason: 'network' });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('adopts a terminal outcome from the winning tab without ever writing a token', async () => {
      mockedAcquireLease.mockResolvedValueOnce({ acquired: false });
      mockedWaitForOutcome.mockResolvedValue({
        status: 'terminal',
        code: 'SESSION_REVOKED',
      });

      const outcome = await coordinateRefresh();

      expect(outcome).toEqual({ status: 'terminal', code: 'SESSION_REVOKED' });
      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('never writes the token or broadcasts a refresh that started before an explicit logout', async () => {
      let resolvePost!: (value: { data: { accessToken: string } }) => void;
      mockPost.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePost = resolve;
          }),
      );
      // The logout's own POST (a different call) resolves immediately.
      mockPost.mockResolvedValue({ data: { message: 'ok' } });

      const refreshing = coordinateRefresh();
      await logout();
      resolvePost({ data: { accessToken: 'stale-token' } });

      await refreshing;

      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
      expect(mockedBroadcast).not.toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'stale-token' }),
      );
    });
  });

  describe('transient backoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      __resetSessionCoordinatorStateForTests();
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('honors retryAfterSeconds and serves the cached outcome until it elapses', async () => {
      mockPost.mockRejectedValueOnce(new Error('rate limited'));
      mockedClassify.mockReturnValueOnce({
        status: 'transient',
        reason: 'rate_limited',
        retryAfterSeconds: 5,
      });

      const first = await coordinateRefresh();
      expect(first).toEqual({
        status: 'transient',
        reason: 'rate_limited',
        retryAfterSeconds: 5,
      });
      expect(mockPost).toHaveBeenCalledTimes(1);

      const second = await coordinateRefresh();
      expect(second).toEqual(first);
      expect(mockPost).toHaveBeenCalledTimes(1); // no new network call yet

      jest.advanceTimersByTime(5001);

      mockPost.mockResolvedValueOnce({ data: { accessToken: 'after-window' } });
      const third = await coordinateRefresh();
      expect(third).toEqual({ status: 'success', accessToken: 'after-window' });
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it('backs off (capped) without an explicit retryAfterSeconds and resets on success', async () => {
      mockPost.mockRejectedValue(new Error('network down'));
      mockedClassify.mockReturnValue({
        status: 'transient',
        reason: 'network',
      });

      const first = await coordinateRefresh();
      expect(first).toEqual({ status: 'transient', reason: 'network' });
      expect(mockPost).toHaveBeenCalledTimes(1);

      const second = await coordinateRefresh();
      expect(second).toEqual(first);
      expect(mockPost).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(AUTH_REFRESH_BACKOFF_CAP_MS + 5000);

      mockPost.mockResolvedValueOnce({ data: { accessToken: 'recovered' } });
      const third = await coordinateRefresh();
      expect(third).toEqual({ status: 'success', accessToken: 'recovered' });
      expect(mockPost).toHaveBeenCalledTimes(2);

      // Backoff state was reset by the success above (kept below).
      mockPost.mockRejectedValueOnce(new Error('network down again'));
      mockedClassify.mockReturnValueOnce({
        status: 'transient',
        reason: 'network',
      });
      await coordinateRefresh();
      expect(mockPost).toHaveBeenCalledTimes(3);
    });

    it('grows exponentially across consecutive failures and stays capped, with jitter zeroed out', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);
      mockPost.mockRejectedValue(new Error('down'));
      mockedClassify.mockReturnValue({
        status: 'transient',
        reason: 'network',
      });

      const expectStillCachedThenAllowed = async (delayMs: number) => {
        jest.advanceTimersByTime(delayMs - 1);
        const before = mockPost.mock.calls.length;
        await coordinateRefresh();
        expect(mockPost).toHaveBeenCalledTimes(before); // just before: cached

        jest.advanceTimersByTime(1);
        await coordinateRefresh();
        expect(mockPost).toHaveBeenCalledTimes(before + 1); // just after: a real POST
      };

      await coordinateRefresh(); // failure 1 -> next delay 1000ms
      expect(mockPost).toHaveBeenCalledTimes(1);

      await expectStillCachedThenAllowed(1000); // -> failure 2, next delay 2000ms
      await expectStillCachedThenAllowed(2000); // -> failure 3, next delay 4000ms
      await expectStillCachedThenAllowed(4000); // -> failure 4, next delay 8000ms
      await expectStillCachedThenAllowed(8000); // -> failure 5, next delay 16000ms
      await expectStillCachedThenAllowed(16000); // -> failure 6, raw 32000 capped to 30000ms

      // Capped: one more failure still waits exactly the cap, never more.
      await expectStillCachedThenAllowed(AUTH_REFRESH_BACKOFF_CAP_MS);
    });

    it("bypassBackoff skips this tab's own exponential backoff but still honors an active server Retry-After (orchestrator decision)", async () => {
      // Exponential (self-imposed) backoff: bypass actually triggers a
      // fresh network attempt.
      mockPost.mockRejectedValueOnce(new Error('down'));
      mockedClassify.mockReturnValueOnce({
        status: 'transient',
        reason: 'network',
      });
      await coordinateRefresh();
      expect(mockPost).toHaveBeenCalledTimes(1);

      mockPost.mockResolvedValueOnce({ data: { accessToken: 'bypassed' } });
      const bypassed = await coordinateRefresh({ bypassBackoff: true });
      expect(bypassed).toEqual({ status: 'success', accessToken: 'bypassed' });
      expect(mockPost).toHaveBeenCalledTimes(2);

      // Server-mandated Retry-After: bypass is still refused.
      mockPost.mockRejectedValueOnce(new Error('rate limited'));
      mockedClassify.mockReturnValueOnce({
        status: 'transient',
        reason: 'rate_limited',
        retryAfterSeconds: 30,
      });
      await coordinateRefresh();
      expect(mockPost).toHaveBeenCalledTimes(3);

      const stillBlocked = await coordinateRefresh({ bypassBackoff: true });
      expect(stillBlocked).toEqual({
        status: 'transient',
        reason: 'rate_limited',
        retryAfterSeconds: 30,
      });
      expect(mockPost).toHaveBeenCalledTimes(3); // no new network call
    });

    it('reports the remaining Retry-After seconds (not the original value) to a bypassed retry mid-countdown', async () => {
      mockPost.mockRejectedValueOnce(new Error('rate limited'));
      mockedClassify.mockReturnValueOnce({
        status: 'transient',
        reason: 'rate_limited',
        retryAfterSeconds: 10,
      });
      await coordinateRefresh();

      // Halfway through the 10s window: an impatient user-initiated retry
      // must see ~5s left, never the original 10 — the visible countdown
      // must never jump back up.
      jest.advanceTimersByTime(5000);
      const midCountdown = await coordinateRefresh({ bypassBackoff: true });
      expect(midCountdown).toEqual({
        status: 'transient',
        reason: 'rate_limited',
        retryAfterSeconds: 5,
      });
      expect(mockPost).toHaveBeenCalledTimes(1); // still no new network call
    });
  });

  describe('ensureFreshAccessToken', () => {
    it('returns the current token without refreshing when it is not expiring', async () => {
      const farFutureExp = Math.floor((Date.now() + 60 * 60 * 1000) / 1000);
      const token = `h.${btoa(
        JSON.stringify({ sub: 'u1', exp: farFutureExp }),
      )}.s`;
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);

      const outcome = await ensureFreshAccessToken();

      expect(outcome).toEqual({ status: 'success', accessToken: token });
      expect(mockedAcquireLease).not.toHaveBeenCalled();
    });

    it('coordinates a refresh when there is no token', async () => {
      mockPost.mockResolvedValue({ data: { accessToken: 'issued-token' } });

      const outcome = await ensureFreshAccessToken();

      expect(outcome).toEqual({
        status: 'success',
        accessToken: 'issued-token',
      });
      expect(mockedAcquireLease).toHaveBeenCalled();
    });

    describe('refresh window boundary', () => {
      const tokenExpiringIn = (seconds: number): string =>
        `h.${btoa(
          JSON.stringify({
            sub: 'u1',
            exp: Math.floor(Date.now() / 1000) + seconds,
          }),
        )}.s`;

      it('refreshes exactly once when 30s from expiry (inside the 60s window)', async () => {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenExpiringIn(30));
        mockPost.mockResolvedValue({ data: { accessToken: 'refreshed' } });

        const outcome = await ensureFreshAccessToken();

        expect(outcome).toEqual({
          status: 'success',
          accessToken: 'refreshed',
        });
        expect(mockPost).toHaveBeenCalledTimes(1);
      });

      it('refreshes exactly once when already expired (60s in the past)', async () => {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenExpiringIn(-60));
        mockPost.mockResolvedValue({ data: { accessToken: 'refreshed' } });

        const outcome = await ensureFreshAccessToken();

        expect(outcome).toEqual({
          status: 'success',
          accessToken: 'refreshed',
        });
        expect(mockPost).toHaveBeenCalledTimes(1);
      });

      it('never refreshes when 61s from expiry (just outside the 60s window)', async () => {
        const token = tokenExpiringIn(61);
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);

        const outcome = await ensureFreshAccessToken();

        expect(outcome).toEqual({ status: 'success', accessToken: token });
        expect(mockPost).not.toHaveBeenCalled();
      });
    });
  });

  describe('getAccessToken', () => {
    it('reads the stored access token', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'stored-token');
      expect(getAccessToken()).toBe('stored-token');
    });
  });

  describe('handleTerminalSessionFailure', () => {
    it('clears local session state, preserves the return route bound to the expiring user, and redirects', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
      mockPost.mockResolvedValue({ data: { message: 'ok' } });

      handleTerminalSessionFailure();

      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
      expect(mockedClearCachedWorkouts).toHaveBeenCalledTimes(1);
      expect(mockedStoreReturnTo).toHaveBeenCalledWith('/', 'user-1');
      expect(mockedRedirectTo).toHaveBeenCalledWith(APP_ROUTES.AUTH.SIGNIN);
      expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('logout'));
    });

    it('never touches a stored workout draft on a terminal expiry', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
      mockPost.mockResolvedValue({ data: { message: 'ok' } });
      writeWorkoutDraft(
        'user-1',
        '2024-01-01',
        { name: 'Leg Day', date: '2024-01-01', exercises: [] },
        'req-1',
      );

      handleTerminalSessionFailure();

      expect(readWorkoutDraft('user-1', '2024-01-01')).not.toBeNull();
      expect(mockedClearWorkoutDraftsForUser).not.toHaveBeenCalled();
      expect(mockedStoreReturnTo).toHaveBeenCalledWith('/', 'user-1');
    });

    it('stores a real, bound returnTo entry in localStorage for a known expiring user', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
      mockPost.mockResolvedValue({ data: { message: 'ok' } });
      mockedStoreReturnTo.mockImplementationOnce(
        jest.requireActual('@utils').storeReturnTo,
      );

      handleTerminalSessionFailure();

      const stored = JSON.parse(
        localStorage.getItem(AUTH_RETURN_TO_KEY) ?? '{}',
      );
      expect(stored).toMatchObject({ path: '/', userId: 'user-1' });
    });

    it('stores an unbound return route (any subsequent sign-in may consume it) when the token has no decodable user id — orchestrator decision', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'not-a-jwt');
      mockPost.mockResolvedValue({ data: { message: 'ok' } });

      handleTerminalSessionFailure();

      expect(mockedStoreReturnTo).toHaveBeenCalledWith('/', null);
    });

    it('still redirects even if the best-effort logout call fails', async () => {
      mockPost.mockRejectedValue(new Error('network down'));

      handleTerminalSessionFailure();

      expect(mockedRedirectTo).toHaveBeenCalledWith(APP_ROUTES.AUTH.SIGNIN);
      // flush the rejected best-effort promise so it doesn't leak into other tests
      await Promise.resolve();
    });
  });

  describe('logout', () => {
    it('revokes the session, clears local state, clears cross-tab refresh state, and redirects', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'token');
      mockPost.mockResolvedValue({ data: { message: 'ok' } });

      await logout();

      expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('logout'));
      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
      expect(mockedClearCachedWorkouts).toHaveBeenCalledTimes(1);
      expect(mockedClearCrossTabRefreshState).toHaveBeenCalledTimes(1);
      expect(mockedRedirectTo).toHaveBeenCalledWith(APP_ROUTES.AUTH.SIGNIN);
    });

    it('still clears local state and redirects if the server call fails', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'token');
      mockPost.mockRejectedValue(new Error('network down'));

      await logout();

      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
      expect(mockedRedirectTo).toHaveBeenCalledWith(APP_ROUTES.AUTH.SIGNIN);
    });

    it("clears the logging-out user's local workout drafts and broadcasts a logout event", async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
      mockPost.mockResolvedValue({ data: { message: 'ok' } });

      await logout();

      expect(mockedClearWorkoutDraftsForUser).toHaveBeenCalledWith('user-1');
      expect(mockedBroadcastLogout).toHaveBeenCalledTimes(1);
    });

    it('never touches drafts when the token has no decodable user id', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'not-a-jwt');
      mockPost.mockResolvedValue({ data: { message: 'ok' } });

      await logout();

      expect(mockedClearWorkoutDraftsForUser).not.toHaveBeenCalled();
    });
  });

  describe('cross-tab logout subscription', () => {
    it('clears local state and redirects when another tab broadcasts a logout', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'some-token');

      onCrossTabLogout();

      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
      expect(mockedClearCachedWorkouts).toHaveBeenCalled();
      expect(mockedRedirectTo).toHaveBeenCalledWith(APP_ROUTES.AUTH.SIGNIN);
    });

    it('never writes the token nor broadcasts success when a held owned refresh resolves after a cross-tab logout', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'stale-token');
      let resolvePost!: (value: { data: { accessToken: string } }) => void;
      mockPost.mockReturnValue(
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
      );

      const refreshing = coordinateRefresh();
      onCrossTabLogout(); // another tab's explicit logout, received here
      resolvePost({ data: { accessToken: 'late-refresh-token' } });

      await refreshing;

      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
      expect(mockedBroadcast).not.toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'late-refresh-token' }),
      );
    });

    it('never resurrects the session when a refresh started *during* the logout() network await resolves after logout has fully finished', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'stale-token');

      let resolveLogoutPost!: (value: { data: { message: string } }) => void;
      mockPost.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveLogoutPost = resolve;
          }),
      );
      const loggingOut = logout(); // bumps generation once, then awaits its own POST

      let resolveInFlightRefreshPost!: (value: {
        data: { accessToken: string };
      }) => void;
      mockPost.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveInFlightRefreshPost = resolve;
          }),
      );
      // Started while `logout()` is still awaiting its own POST: captures the
      // generation as it stood right after the *first* bump.
      const refreshDuringLogout = coordinateRefresh();

      resolveLogoutPost({ data: { message: 'ok' } });
      await loggingOut; // completes fully: local state cleared, generation bumped again

      // Only now does the interleaved refresh's own POST resolve — strictly
      // after logout() already finished.
      resolveInFlightRefreshPost({
        data: { accessToken: 'resurrected-token' },
      });
      await refreshDuringLogout;

      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    });

    it("never writes the token when the winning tab's outcome arrives after a cross-tab logout was received while waiting", async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'stale-token');
      mockedAcquireLease.mockResolvedValueOnce({ acquired: false });
      let resolveWaiter!: (
        outcome: { status: 'success'; accessToken: string } | null,
      ) => void;
      mockedWaitForOutcome.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveWaiter = resolve;
        }),
      );

      const refreshing = coordinateRefresh();
      onCrossTabLogout();
      resolveWaiter({ status: 'success', accessToken: 'from-other-tab-late' });

      const outcome = await refreshing;

      expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
      // Not just "no token written": the caller must never be told this was
      // a success either — the interceptor would otherwise happily replay
      // the original request with `from-other-tab-late`, a token issued for
      // a generation that no longer exists in this tab.
      expect(outcome.status).not.toBe('success');
      expect(outcome).toEqual({ status: 'transient', reason: 'network' });
    });
  });
});
