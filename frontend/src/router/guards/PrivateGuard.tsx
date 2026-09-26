import { useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { useSessionRefresh, useUser } from '@hooks';
import { onAuthIdentityChange, useAuthSession } from '@services/session';

// Accessible, non-redirecting fallback for a transient (network/429/5xx)
// bootstrap outcome: the session is left untouched, so a
// retry can succeed once connectivity/the backend recovers. The retry
// button stays available even during a server-mandated `Retry-After`
// window — `retry()` itself still honors that window — but the countdown
// is surfaced so the user understands why an immediate click won't do
// anything yet.
//
// The countdown lives in its own `role="status"` region, a sibling of (not
// nested inside) the `role="alert"` message — stacking an assertive alert
// and a per-tick live region on the same container would re-announce the
// whole thing every second. Whenever this screen (re)mounts — including the
// remount `retry()` causes by driving `status` through `checking` — focus
// moves onto the Retry button instead of being left on `document.body`.
const SessionRetryScreen = ({
  onRetry,
  retryAfterSeconds,
}: {
  onRetry: () => void;
  retryAfterSeconds: number | null;
}) => {
  const { session } = DICTIONARY.common;
  const retryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    retryButtonRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-main px-6 text-center text-white">
      <div role="alert">
        <p className="text-lg font-semibold">{session.retryTitle}</p>
        <p className="text-sm text-text-soft">{session.retryMessage}</p>
      </div>
      {retryAfterSeconds !== null && retryAfterSeconds > 0 && (
        <p role="status" className="text-xs text-text-soft">
          {session.retryAvailableIn(retryAfterSeconds)}
        </p>
      )}
      <button
        ref={retryButtonRef}
        type="button"
        onClick={onRetry}
        className="rounded-xl bg-primary px-4 py-2 font-semibold text-surface"
      >
        {session.retryButton}
      </button>
    </div>
  );
};

export const PrivateGuard = () => {
  const { status, retry, retryAfterSeconds } = useSessionRefresh();
  const { sub } = useAuthSession();
  const queryClient = useQueryClient();

  useUser();

  useEffect(() => {
    // Registered once per mount; the listener itself runs synchronously
    // inside the underlying storage/custom-event handler, strictly before
    // `useAuthSession`'s own re-render is triggered — so the cache is empty
    // by the time the newly keyed subtree below ever renders/fetches,
    // instead of racing a post-commit effect against it.
    return onAuthIdentityChange(() => {
      queryClient.clear();
    });
  }, [queryClient]);

  if (status === 'anonymous') {
    return <Navigate to={APP_ROUTES.AUTH.SIGNIN} replace />;
  }

  if (status === 'transient') {
    return (
      <SessionRetryScreen
        onRetry={retry}
        retryAfterSeconds={retryAfterSeconds}
      />
    );
  }

  if (status === 'checking') {
    return null;
  }

  // Keyed by `sub`: a same-tab identity change always
  // remounts the whole protected subtree instead of leaving stale
  // component/hook state (e.g. a still-mounted create-workout form) bound to
  // a user who is no longer signed in.
  return <Outlet key={sub ?? 'anonymous'} />;
};
