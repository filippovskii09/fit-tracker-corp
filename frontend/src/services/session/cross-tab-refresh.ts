import {
  AUTH_BROADCAST_CHANNEL_NAME,
  AUTH_LOGOUT_BROADCAST_KEY,
  AUTH_REFRESH_LEASE_KEY,
  AUTH_REFRESH_LEASE_TTL_MS,
  AUTH_REFRESH_RESULT_KEY,
  AUTH_REFRESH_RESULT_FRESHNESS_MS,
} from '@constants';
import type { SessionOutcome } from '@types';

// Cross-tab refresh ownership (design.md D4, task 6.3). `navigator.locks` is
// the primary mutual-exclusion mechanism when available: it holds the lock
// for the exact lifetime of the async callback, so there is no lease TTL to
// tune and no way for one tab to accidentally keep two owners active. Where
// Web Locks isn't available, a bounded `localStorage` lease plus the
// `storage` event is the correctness fallback: every
// attempt carries its own id, and the write is read back before trusting it,
// so two tabs racing to acquire in the same tick can't both believe they won.
const tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const AUTH_REFRESH_LOCK_NAME = 'fit-tracker:auth-refresh-lock';

const getChannel = (): BroadcastChannel | null =>
  typeof BroadcastChannel === 'undefined'
    ? null
    : new BroadcastChannel(AUTH_BROADCAST_CHANNEL_NAME);

interface Lease {
  id: string;
  attempt: string;
  expiresAt: number;
}

const readLease = (): Lease | null => {
  const raw = localStorage.getItem(AUTH_REFRESH_LEASE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Lease;
  } catch {
    return null;
  }
};

/**
 * Bounded fallback lease: expires on its own even if the owning tab
 * crashes/closes. Every attempt is tagged with a unique id and re-read after
 * the write, so a concurrent writer that clobbered this attempt in the same
 * tick is detected instead of both tabs believing they hold the lease.
 */
export const tryAcquireRefreshLease = (): boolean => {
  const now = Date.now();
  const lease = readLease();

  if (lease && lease.id !== tabId && lease.expiresAt > now) {
    return false;
  }

  const attempt = `${tabId}:${now}:${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(
    AUTH_REFRESH_LEASE_KEY,
    JSON.stringify({
      id: tabId,
      attempt,
      expiresAt: now + AUTH_REFRESH_LEASE_TTL_MS,
    }),
  );

  const confirmed = readLease();
  return confirmed?.id === tabId && confirmed?.attempt === attempt;
};

export const releaseRefreshLease = (): void => {
  const lease = readLease();
  if (lease?.id === tabId) {
    localStorage.removeItem(AUTH_REFRESH_LEASE_KEY);
  }
};

type LeaseOutcome<T> = { acquired: true; value: T } | { acquired: false };

/**
 * Preferred lease acquisition path: `navigator.locks`
 * holds mutual exclusion for exactly the duration of `ownerFn`, so there is
 * nothing to release manually and no window for a stale/expired lease.
 * Falls back to the `localStorage` lease above when Web Locks isn't
 * available (older browsers, some embedded webviews).
 */
export const acquireRefreshLease = async <T>(
  ownerFn: () => Promise<T>,
): Promise<LeaseOutcome<T>> => {
  const locks = (typeof navigator !== 'undefined' && navigator.locks) || null;

  if (locks?.request) {
    let acquired = false;
    let value: T | undefined;

    await locks.request(
      AUTH_REFRESH_LOCK_NAME,
      { ifAvailable: true },
      async (lock) => {
        if (!lock) {
          return;
        }
        acquired = true;
        value = await ownerFn();
      },
    );

    return acquired
      ? { acquired: true, value: value as T }
      : { acquired: false };
  }

  if (!tryAcquireRefreshLease()) {
    return { acquired: false };
  }

  try {
    const value = await ownerFn();
    return { acquired: true, value };
  } finally {
    releaseRefreshLease();
  }
};

/**
 * Clears any stale lease/result entries so other tabs never act on a
 * refresh outcome from before an explicit logout.
 */
export const clearCrossTabRefreshState = (): void => {
  localStorage.removeItem(AUTH_REFRESH_LEASE_KEY);
  localStorage.removeItem(AUTH_REFRESH_RESULT_KEY);
};

interface PersistedOutcome {
  outcome: SessionOutcome;
  emittedAt: number;
}

export const broadcastRefreshOutcome = (outcome: SessionOutcome): void => {
  const payload = JSON.stringify({
    outcome,
    emittedAt: Date.now(),
  } satisfies PersistedOutcome);

  const channel = getChannel();
  if (channel) {
    channel.postMessage(payload);
    channel.close();
  }

  // Always mirror to localStorage: this is what tabs without
  // `BroadcastChannel` observe via the `storage` event.
  localStorage.setItem(AUTH_REFRESH_RESULT_KEY, payload);
};

const parsePersistedOutcome = (raw: string): PersistedOutcome | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedOutcome>;
    if (!parsed || typeof parsed.emittedAt !== 'number' || !parsed.outcome) {
      return null;
    }
    return parsed as PersistedOutcome;
  } catch {
    return null;
  }
};

/**
 * A result the lease holder already finished and wrote before this waiter
 * attached its listener — checked first so a waiter never
 * blocks for the full timeout on an outcome that already arrived.
 */
const readFreshPersistedOutcome = (): SessionOutcome | null => {
  const raw = localStorage.getItem(AUTH_REFRESH_RESULT_KEY);
  if (!raw) {
    return null;
  }
  const persisted = parsePersistedOutcome(raw);
  if (!persisted) {
    return null;
  }
  if (Date.now() - persisted.emittedAt > AUTH_REFRESH_RESULT_FRESHNESS_MS) {
    return null;
  }
  return persisted.outcome;
};

/** Resolves with the winning tab's outcome, or `null` if nothing arrived. */
export const waitForRefreshOutcome = (
  timeoutMs: number,
): Promise<SessionOutcome | null> => {
  const alreadyPersisted = readFreshPersistedOutcome();
  if (alreadyPersisted) {
    return Promise.resolve(alreadyPersisted);
  }

  return new Promise((resolve) => {
    let settled = false;
    const channel = getChannel();

    const finish = (outcome: SessionOutcome | null) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      channel?.close();
      window.removeEventListener('storage', onStorage);
      resolve(outcome);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_REFRESH_RESULT_KEY || !event.newValue) {
        return;
      }
      const persisted = parsePersistedOutcome(event.newValue);
      finish(persisted?.outcome ?? null);
    };

    if (channel) {
      channel.onmessage = (event: MessageEvent<string>) => {
        // The channel is shared with `broadcastLogout` (e.g. a stray
        // `{ kind: 'logout' }` message): only a genuine persisted outcome
        // ever settles this wait — anything else is silently ignored so a
        // logout broadcast can never be mistaken for "no outcome arrived".
        const persisted = parsePersistedOutcome(event.data);
        if (persisted) {
          finish(persisted.outcome);
        }
      };
    }
    window.addEventListener('storage', onStorage);

    const timer = setTimeout(() => finish(null), timeoutMs);
  });
};

/**
 * Explicit-logout broadcast: every other tab clears its own session and
 * returns to sign-in, regardless of what a refresh already in flight there
 * resolves to (design.md D5).
 */
export const broadcastLogout = (): void => {
  const payload = JSON.stringify({ at: Date.now() });

  const channel = getChannel();
  if (channel) {
    channel.postMessage(JSON.stringify({ kind: 'logout', at: Date.now() }));
    channel.close();
  }

  localStorage.setItem(AUTH_LOGOUT_BROADCAST_KEY, payload);
};

export const subscribeToLogoutBroadcast = (
  onLogout: () => void,
): (() => void) => {
  const channel = getChannel();

  if (channel) {
    channel.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as { kind?: string };
        if (parsed.kind === 'logout') {
          onLogout();
        }
      } catch {
        // Ignore malformed cross-tab messages.
      }
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === AUTH_LOGOUT_BROADCAST_KEY && event.newValue) {
      onLogout();
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    channel?.close();
    window.removeEventListener('storage', onStorage);
  };
};
