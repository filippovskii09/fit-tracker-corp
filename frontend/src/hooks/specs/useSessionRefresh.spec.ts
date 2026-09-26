import { ACCESS_TOKEN_STORAGE_KEY } from '@constants';
import { act, renderHook, waitFor } from '@testUtils';
import {
  AUTH_STORE_CHANGE_EVENT,
  __resetAuthStoreForTests,
  ensureFreshAccessToken,
  handleTerminalSessionFailure,
} from '@services/session';
import { useSessionRefresh } from '../useSessionRefresh';

jest.mock('@services/session', () => ({
  ...jest.requireActual('@services/session'),
  ensureFreshAccessToken: jest.fn(),
  getAccessToken: jest.fn(() => localStorage.getItem('accessToken')),
  handleTerminalSessionFailure: jest.fn(),
}));

const mockedEnsureFreshAccessToken = ensureFreshAccessToken as jest.Mock;
const mockedHandleTerminalSessionFailure =
  handleTerminalSessionFailure as jest.Mock;

const tokenFor = (userId: string, seconds = 3600): string =>
  `h.${btoa(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + seconds,
    }),
  )}.s`;

// The real coordinator writes the new token to `localStorage` and notifies
// the auth store as part of a successful refresh — replicated here since
// `ensureFreshAccessToken` itself is mocked, so the reactive `sub` stays in
// sync with the mocked outcome exactly like it would in production.
const resolveWithToken = (userId: string) => {
  const accessToken = tokenFor(userId);
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  window.dispatchEvent(new Event(AUTH_STORE_CHANGE_EVENT));
  return { status: 'success' as const, accessToken };
};

describe('useSessionRefresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    __resetAuthStoreForTests();
    mockedEnsureFreshAccessToken.mockResolvedValue({ status: 'success' });
  });

  describe('bootstrap', () => {
    it('starts authenticated without a network call when the token is fresh', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u1'));

      const { result } = renderHook(() => useSessionRefresh());

      expect(result.current.status).toBe('authenticated');
      expect(mockedEnsureFreshAccessToken).not.toHaveBeenCalled();
    });

    it('starts checking and moves to authenticated on a successful refresh when there is no token', async () => {
      const { result } = renderHook(() => useSessionRefresh());

      expect(result.current.status).toBe('checking');
      await waitFor(() => expect(result.current.status).toBe('authenticated'));
      expect(mockedEnsureFreshAccessToken).toHaveBeenCalledTimes(1);
    });

    it('ends the session and reports anonymous on a terminal bootstrap outcome', async () => {
      mockedEnsureFreshAccessToken.mockResolvedValue({
        status: 'terminal',
        code: 'SESSION_REVOKED',
      });

      const { result } = renderHook(() => useSessionRefresh());

      await waitFor(() => expect(result.current.status).toBe('anonymous'));
      expect(mockedHandleTerminalSessionFailure).toHaveBeenCalledTimes(1);
    });

    it('reports transient without clearing auth or redirecting on a network/5xx outcome', async () => {
      mockedEnsureFreshAccessToken.mockResolvedValue({
        status: 'transient',
        reason: 'network',
      });

      const { result } = renderHook(() => useSessionRefresh());

      await waitFor(() => expect(result.current.status).toBe('transient'));
      expect(mockedHandleTerminalSessionFailure).not.toHaveBeenCalled();
      expect(result.current.retryAfterSeconds).toBeNull();
    });

    it("retry() re-runs the bootstrap check, bypassing this tab's own backoff, and can recover from transient", async () => {
      mockedEnsureFreshAccessToken.mockResolvedValueOnce({
        status: 'transient',
        reason: 'network',
      });
      const { result } = renderHook(() => useSessionRefresh());
      await waitFor(() => expect(result.current.status).toBe('transient'));

      mockedEnsureFreshAccessToken.mockResolvedValueOnce({ status: 'success' });
      act(() => {
        result.current.retry();
      });

      await waitFor(() => expect(result.current.status).toBe('authenticated'));
      expect(mockedEnsureFreshAccessToken).toHaveBeenCalledTimes(2);
      expect(mockedEnsureFreshAccessToken).toHaveBeenLastCalledWith({
        bypassBackoff: true,
      });
    });

    describe('with fake timers', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('surfaces and counts down a server-mandated Retry-After on a transient outcome', async () => {
        mockedEnsureFreshAccessToken.mockResolvedValue({
          status: 'transient',
          reason: 'rate_limited',
          retryAfterSeconds: 3,
        });

        const { result } = renderHook(() => useSessionRefresh());
        await waitFor(() => expect(result.current.status).toBe('transient'));
        expect(result.current.retryAfterSeconds).toBe(3);

        await act(async () => {
          jest.advanceTimersByTime(1000);
          await Promise.resolve();
        });
        expect(result.current.retryAfterSeconds).toBe(2);
      });
    });
  });

  describe('identity change while mounted (guard must never keep an authenticated status for a stale identity)', () => {
    it('re-runs the bootstrap and never renders authenticated at any point after the token disappears underneath it', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u1'));
      const seen: string[] = [];
      const { result } = renderHook(() => {
        const bootstrap = useSessionRefresh();
        seen.push(bootstrap.status);
        return bootstrap;
      });
      expect(result.current.status).toBe('authenticated');

      mockedEnsureFreshAccessToken.mockResolvedValue({
        status: 'terminal',
        code: 'SESSION_NOT_FOUND',
      });

      // Recorded from this point on — checking every render the hook
      // produces, not just the value read after React has already settled —
      // since a stale `authenticated` render in between would be invisible
      // to an assertion made only after `act`/`waitFor` has flushed.
      const mark = seen.length;
      act(() => {
        localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: ACCESS_TOKEN_STORAGE_KEY,
            newValue: null,
          }),
        );
      });

      await waitFor(() => expect(result.current.status).toBe('anonymous'));
      expect(seen.slice(mark)).not.toContain('authenticated');
      expect(
        seen
          .slice(mark)
          .every((status) =>
            (['checking', 'anonymous'] as const).includes(
              status as 'checking' | 'anonymous',
            ),
          ),
      ).toBe(true);
      expect(mockedHandleTerminalSessionFailure).toHaveBeenCalledTimes(1);
    });

    it('re-runs the bootstrap once more if the identity moves on again while an attempt is still in flight, instead of getting stuck on checking', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u1'));
      const { result } = renderHook(() => useSessionRefresh());
      expect(result.current.status).toBe('authenticated');

      let resolveFirst!: (outcome: {
        status: 'success';
        accessToken: string;
      }) => void;
      mockedEnsureFreshAccessToken.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      );

      act(() => {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u2'));
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: ACCESS_TOKEN_STORAGE_KEY,
            newValue: tokenFor('u2'),
          }),
        );
      });
      await waitFor(() => expect(result.current.status).toBe('checking'));

      let resolveSecond!: (outcome: {
        status: 'success';
        accessToken: string;
      }) => void;
      mockedEnsureFreshAccessToken.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

      // The identity moves on again while the first attempt is still in
      // flight: the sub-change effect bails out (one attempt is already
      // running), so only the `finally` re-check can ever notice this.
      act(() => {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u3'));
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: ACCESS_TOKEN_STORAGE_KEY,
            newValue: tokenFor('u3'),
          }),
        );
      });

      resolveFirst({ status: 'success', accessToken: tokenFor('u2') });

      // Without the `finally` re-check, this settles on a stale `u2`
      // decision that no longer matches the live identity (`u3`) and the
      // guard would be masked to `checking` forever — a permanently blank
      // page, with nothing left to ever trigger another attempt.
      await waitFor(() =>
        expect(mockedEnsureFreshAccessToken).toHaveBeenCalledTimes(2),
      );
      expect(result.current.status).toBe('checking');

      resolveSecond({ status: 'success', accessToken: tokenFor('u3') });

      await waitFor(() => expect(result.current.status).toBe('authenticated'));
    });

    it('re-verifies (without treating it as terminal) when a different user signs in underneath it', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u1'));
      const { result } = renderHook(() => useSessionRefresh());
      expect(result.current.status).toBe('authenticated');

      mockedEnsureFreshAccessToken.mockImplementation(async () =>
        resolveWithToken('u2'),
      );

      act(() => {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u2'));
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: ACCESS_TOKEN_STORAGE_KEY,
            newValue: tokenFor('u2'),
          }),
        );
      });

      await waitFor(() => expect(result.current.status).toBe('authenticated'));
      expect(result.current.status).toBe('authenticated');
    });
  });

  describe('background probe on focus/reconnect (task 6.2)', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('refreshes again when the window regains focus, without disturbing an authenticated status', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u1'));
      const { result } = renderHook(() => useSessionRefresh());
      expect(result.current.status).toBe('authenticated');

      window.dispatchEvent(new Event('focus'));
      await waitFor(() =>
        expect(mockedEnsureFreshAccessToken).toHaveBeenCalledTimes(1),
      );
      expect(result.current.status).toBe('authenticated');
    });

    it('refreshes again when the browser comes back online', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u1'));
      renderHook(() => useSessionRefresh());

      window.dispatchEvent(new Event('online'));
      await waitFor(() =>
        expect(mockedEnsureFreshAccessToken).toHaveBeenCalledTimes(1),
      );
    });

    it('ends the session on a terminal background outcome', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u1'));
      const { result } = renderHook(() => useSessionRefresh());
      expect(result.current.status).toBe('authenticated');

      mockedEnsureFreshAccessToken.mockResolvedValue({
        status: 'terminal',
        code: 'SESSION_REVOKED',
      });
      window.dispatchEvent(new Event('focus'));

      await waitFor(() => expect(result.current.status).toBe('anonymous'));
      expect(mockedHandleTerminalSessionFailure).toHaveBeenCalledTimes(1);
    });

    it('recovers from a previously transient status on a successful background probe', async () => {
      mockedEnsureFreshAccessToken.mockResolvedValueOnce({
        status: 'transient',
        reason: 'network',
      });
      const { result } = renderHook(() => useSessionRefresh());
      await waitFor(() => expect(result.current.status).toBe('transient'));

      mockedEnsureFreshAccessToken.mockImplementationOnce(async () =>
        resolveWithToken('u1'),
      );
      act(() => {
        window.dispatchEvent(new Event('focus'));
      });

      await waitFor(() => expect(result.current.status).toBe('authenticated'));
    });

    it('re-runs a background probe once more if the identity moves on again while it is still in flight, instead of settling authenticated for a stale identity', async () => {
      // Starts transient: no token yet, and the initial bootstrap fails.
      mockedEnsureFreshAccessToken.mockResolvedValueOnce({
        status: 'transient',
        reason: 'network',
      });
      const { result } = renderHook(() => useSessionRefresh());
      await waitFor(() => expect(result.current.status).toBe('transient'));

      let resolveProbe!: (outcome: {
        status: 'success';
        accessToken: string;
      }) => void;
      mockedEnsureFreshAccessToken.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveProbe = resolve;
          }),
      );
      act(() => {
        window.dispatchEvent(new Event('focus'));
      });
      await waitFor(() =>
        expect(mockedEnsureFreshAccessToken).toHaveBeenCalledTimes(2),
      );

      // A different user signs in underneath it while the probe is still
      // pending — the sub-change effect bails out (a refresh is already in
      // flight), so only the background probe's own `finally` re-check can
      // ever notice this.
      act(() => {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u2'));
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: ACCESS_TOKEN_STORAGE_KEY,
            newValue: tokenFor('u2'),
          }),
        );
      });

      let resolveRecheck!: (outcome: {
        status: 'success';
        accessToken: string;
      }) => void;
      mockedEnsureFreshAccessToken.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRecheck = resolve;
          }),
      );

      // The pending probe now resolves with the *old* (pre-switch) user's
      // token — stale relative to the identity that has since signed in.
      resolveProbe({ status: 'success', accessToken: tokenFor('u1') });

      // Without the `finally` re-check at the end of the background probe,
      // this would settle `authenticated` for `u1` and never notice `u2` has
      // since signed in — no third call, and `effectiveStatus` would mask
      // the mismatch as `checking` forever.
      await waitFor(() =>
        expect(mockedEnsureFreshAccessToken).toHaveBeenCalledTimes(3),
      );

      resolveRecheck({ status: 'success', accessToken: tokenFor('u2') });

      await waitFor(() => expect(result.current.status).toBe('authenticated'));
      expect(result.current.status).toBe('authenticated');
    });

    it('removes the focus/online listeners on unmount', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u1'));
      const removeSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useSessionRefresh());

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    });

    it('never calls ensureFreshAccessToken again for a focus/online event after unmount', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('u1'));
      const { unmount } = renderHook(() => useSessionRefresh());
      unmount();
      mockedEnsureFreshAccessToken.mockClear();

      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('online'));

      expect(mockedEnsureFreshAccessToken).not.toHaveBeenCalled();
    });
  });
});
