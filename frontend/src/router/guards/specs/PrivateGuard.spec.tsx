import { useState } from 'react';
import { act, render as rtlRender } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { fireEvent, screen } from '@testUtils';
import { ACCESS_TOKEN_STORAGE_KEY, APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { useSessionRefresh, useUser } from '@hooks';
import {
  AUTH_STORE_CHANGE_EVENT,
  __resetAuthStoreForTests,
} from '@services/session';
import { PrivateGuard } from '../PrivateGuard';

jest.mock('@hooks', () => ({
  useUser: jest.fn(),
  useSessionRefresh: jest.fn(),
}));

// `useAuthSession`/`onAuthIdentityChange` are deliberately real here (not
// mocked): the guarantee — the query cache is cleared strictly before
// the newly keyed subtree ever renders/fetches — only holds through the
// actual auth-store wiring, not through a `useAuthSession` mock driven by
// `rerender`.
const tokenFor = (userId: string, exp = 9999999999): string =>
  `h.${btoa(JSON.stringify({ sub: userId, exp }))}.s`;

describe('PrivateGuard', () => {
  const mockUseUser = useUser as jest.Mock;
  const mockUseSessionRefresh = useSessionRefresh as jest.Mock;
  const { session } = DICTIONARY.common;

  const renderGuard = (queryClient: QueryClient) =>
    rtlRender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<PrivateGuard />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
            <Route
              path={APP_ROUTES.AUTH.SIGNIN}
              element={<div>Signin Page</div>}
            />
            <Route path="*" element={null} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

  const signInAs = (userId: string, exp?: number): void => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor(userId, exp));
    window.dispatchEvent(new Event(AUTH_STORE_CHANGE_EVENT));
  };

  const signOut = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_STORE_CHANGE_EVENT));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    __resetAuthStoreForTests();
    mockUseUser.mockReturnValue({ isLoading: false, data: { id: 1 } });
  });

  it('renders nothing (no redirect) while the bootstrap check is in flight', () => {
    mockUseSessionRefresh.mockReturnValue({
      status: 'checking',
      retry: jest.fn(),
      retryAfterSeconds: null,
    });

    renderGuard(new QueryClient());

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Signin Page')).not.toBeInTheDocument();
  });

  it('redirects to sign-in when the bootstrap outcome is anonymous', () => {
    mockUseSessionRefresh.mockReturnValue({
      status: 'anonymous',
      retry: jest.fn(),
      retryAfterSeconds: null,
    });

    renderGuard(new QueryClient());

    expect(screen.getByText('Signin Page')).toBeInTheDocument();
  });

  it('renders an accessible, non-redirecting retry screen on a transient outcome', () => {
    const retry = jest.fn();
    mockUseSessionRefresh.mockReturnValue({
      status: 'transient',
      retry,
      retryAfterSeconds: null,
    });

    renderGuard(new QueryClient());

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Signin Page')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(session.retryTitle);

    fireEvent.click(screen.getByRole('button', { name: session.retryButton }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('mounts the retry screen with focus already on the Retry control, not left on the body', () => {
    mockUseSessionRefresh.mockReturnValue({
      status: 'transient',
      retry: jest.fn(),
      retryAfterSeconds: null,
    });

    renderGuard(new QueryClient());

    expect(screen.getByRole('button', { name: session.retryButton })).toBe(
      document.activeElement,
    );
  });

  it('returns focus to the (re-mounted) Retry control after a retry cycles the screen through checking, never leaving it on the body', () => {
    mockUseSessionRefresh.mockReturnValue({
      status: 'transient',
      retry: jest.fn(),
      retryAfterSeconds: null,
    });

    const { rerender } = renderGuard(new QueryClient());
    const rerenderGuard = () =>
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={['/protected']}>
            <Routes>
              <Route element={<PrivateGuard />}>
                <Route
                  path="/protected"
                  element={<div>Protected Content</div>}
                />
              </Route>
              <Route path="*" element={null} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

    // A retry drives `status` through `checking` (the guard renders `null`,
    // unmounting the button entirely) before landing back on `transient`
    // with a freshly mounted button.
    mockUseSessionRefresh.mockReturnValue({
      status: 'checking',
      retry: jest.fn(),
      retryAfterSeconds: null,
    });
    act(() => {
      rerenderGuard();
    });
    expect(document.activeElement).toBe(document.body);

    mockUseSessionRefresh.mockReturnValue({
      status: 'transient',
      retry: jest.fn(),
      retryAfterSeconds: null,
    });
    act(() => {
      rerenderGuard();
    });

    expect(screen.getByRole('button', { name: session.retryButton })).toBe(
      document.activeElement,
    );
  });

  it('shows the Retry-After countdown but keeps the retry button available', () => {
    mockUseSessionRefresh.mockReturnValue({
      status: 'transient',
      retry: jest.fn(),
      retryAfterSeconds: 12,
    });

    renderGuard(new QueryClient());

    const countdown = screen.getByRole('status');
    expect(countdown).toHaveTextContent(session.retryAvailableIn(12));
    // The countdown must never live inside the assertive `alert` region —
    // ticking it every second would re-announce the whole alert each time.
    expect(screen.getByRole('alert')).not.toContainElement(countdown);
    expect(
      screen.getByRole('button', { name: session.retryButton }),
    ).toBeEnabled();
  });

  it('renders the outlet once authenticated', () => {
    mockUseSessionRefresh.mockReturnValue({
      status: 'authenticated',
      retry: jest.fn(),
      retryAfterSeconds: null,
    });

    signInAs('user-1');
    renderGuard(new QueryClient());

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  describe('reactive identity (query cache correctness)', () => {
    beforeEach(() => {
      mockUseSessionRefresh.mockReturnValue({
        status: 'authenticated',
        retry: jest.fn(),
        retryAfterSeconds: null,
      });
    });

    it('does not clear the query cache on first mount', () => {
      signInAs('user-1');
      const queryClient = new QueryClient();
      queryClient.setQueryData(['User'], { id: 'user-1' });

      renderGuard(queryClient);

      expect(queryClient.getQueryData(['User'])).toEqual({ id: 'user-1' });
    });

    it("clears the query cache synchronously, before a signed-in-as-a-different-user's subtree can render/fetch", () => {
      signInAs('user-1');
      const queryClient = new QueryClient();
      queryClient.setQueryData(['User'], { id: 'user-1' });

      renderGuard(queryClient);
      expect(queryClient.getQueryData(['User'])).toEqual({ id: 'user-1' });

      act(() => {
        signInAs('user-2');
      });

      // Asserted immediately — before any `waitFor`/render flush — because
      // the clear happens inside the synchronous `storage`/custom-event
      // handler, strictly before React ever re-renders the keyed subtree.
      expect(queryClient.getQueryData(['User'])).toBeUndefined();
    });

    it('clears the cache strictly before the newly-keyed subtree ever reads it during render, not just eventually', () => {
      // A render-time reader is the only thing that can actually
      // distinguish "cleared before this subtree renders" from "cleared
      // eventually, after a render or two has already read the stale
      // cache" — asserting on `queryClient.getQueryData` only after `act`
      // has flushed everything can't tell the two apart.
      const seen: unknown[] = [];
      const ProtectedContent = () => {
        seen.push(useQueryClient().getQueryData(['User']));
        return <div>Protected Content</div>;
      };
      const queryClient = new QueryClient();
      queryClient.setQueryData(['User'], { id: 'user-1' });

      signInAs('user-1');
      rtlRender(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/protected']}>
            <Routes>
              <Route element={<PrivateGuard />}>
                <Route path="/protected" element={<ProtectedContent />} />
              </Route>
              <Route path="*" element={null} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );
      const mark = seen.length;

      act(() => {
        signInAs('user-2');
      });

      expect(seen.length).toBeGreaterThan(mark);
      expect(seen.slice(mark)).toEqual(seen.slice(mark).map(() => undefined));
    });

    it('clears the query cache when the identity is lost (signed out) underneath the guard', () => {
      signInAs('user-1');
      const queryClient = new QueryClient();
      queryClient.setQueryData(['User'], { id: 'user-1' });

      renderGuard(queryClient);

      act(() => {
        signOut();
      });

      expect(queryClient.getQueryData(['User'])).toBeUndefined();
    });
  });

  describe('remount semantics', () => {
    // A stateful child proves whether the protected subtree actually
    // remounted (state reset) or stayed mounted (state preserved) — the
    // `key={sub}` on `Outlet` must only change for a *different* identity,
    // never for a same-user token rotation (a background refresh).
    const StatefulCounter = () => {
      const [count, setCount] = useState(0);
      return (
        <button type="button" onClick={() => setCount((c) => c + 1)}>
          count: {count}
        </button>
      );
    };

    const renderGuardWithStatefulChild = (queryClient: QueryClient) =>
      rtlRender(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/protected']}>
            <Routes>
              <Route element={<PrivateGuard />}>
                <Route path="/protected" element={<StatefulCounter />} />
              </Route>
              <Route path="*" element={null} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

    beforeEach(() => {
      mockUseSessionRefresh.mockReturnValue({
        status: 'authenticated',
        retry: jest.fn(),
        retryAfterSeconds: null,
      });
    });

    it('resets child state when the identity actually changes', () => {
      signInAs('user-1');
      renderGuardWithStatefulChild(new QueryClient());

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('button')).toHaveTextContent('count: 1');

      act(() => {
        signInAs('user-2');
      });

      expect(screen.getByRole('button')).toHaveTextContent('count: 0');
    });

    it('preserves child state across a same-user token rotation (a background refresh)', () => {
      signInAs('user-1');
      renderGuardWithStatefulChild(new QueryClient());

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('button')).toHaveTextContent('count: 1');

      act(() => {
        // A rotated token for the *same* user (`sub` unchanged, only the
        // token string/expiry differ): the auth store's snapshot rebuilds,
        // but `sub` itself stays 'user-1'.
        signInAs('user-1', 8888888888);
      });

      expect(screen.getByRole('button')).toHaveTextContent('count: 1');
    });
  });
});
