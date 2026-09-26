import { useSyncExternalStore } from 'react';

import { ACCESS_TOKEN_STORAGE_KEY } from '@constants';
import { getAccessTokenUserId } from '@utils';

// Central reactive auth snapshot. `PrivateGuard` (and anything else that
// needs to react to a same-tab or cross-tab identity change) subscribes
// through `useAuthSession` instead of reading `localStorage` directly, so a
// token swap is observed as a render instead of silently going stale.
export const AUTH_STORE_CHANGE_EVENT = 'fit-tracker:auth-store-changed';

export interface AuthSnapshot {
  token: string | null;
  sub: string | null;
}

const readToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

let cachedSnapshot: AuthSnapshot = { token: null, sub: null };
let cachedRawToken: string | null | undefined = undefined;

/**
 * Only builds a new snapshot object when the underlying token actually
 * changed, so `useSyncExternalStore` never re-renders subscribers on an
 * unrelated notification.
 */
export const getAuthSnapshot = (): AuthSnapshot => {
  const token = readToken();
  if (token !== cachedRawToken) {
    cachedRawToken = token;
    cachedSnapshot = { token, sub: getAccessTokenUserId(token) };
  }
  return cachedSnapshot;
};

/** Same-tab notification: dispatched by the coordinator on every token write. */
export const notifyAuthStoreChanged = (): void => {
  window.dispatchEvent(new Event(AUTH_STORE_CHANGE_EVENT));
};

type ChangeListener = () => void;
type IdentityChangeListener = (
  sub: string | null,
  previousSub: string | null,
) => void;

const changeListeners = new Set<ChangeListener>();
const identityListeners = new Set<IdentityChangeListener>();
let lastKnownSub: string | null = null;
let initialized = false;
let globalListenersWired = false;

/**
 * Runs synchronously inside the *one* shared `storage`/custom-event
 * listener, before any `useSyncExternalStore` subscriber is notified. That
 * ordering is what makes `onAuthIdentityChange` usable for a side effect
 * (e.g. clearing the query cache) that must complete before the identity
 * change is ever reflected in a render — a `useEffect` reacting to the
 * already-rendered new `sub` is one commit too late for that.
 */
const handleUnderlyingChange = (): void => {
  const { sub } = getAuthSnapshot();
  if (sub !== lastKnownSub) {
    const previousSub = lastKnownSub;
    lastKnownSub = sub;
    identityListeners.forEach((listener) => listener(sub, previousSub));
  }
  changeListeners.forEach((listener) => listener());
};

const handleStorage = (event: StorageEvent): void => {
  if (event.key === ACCESS_TOKEN_STORAGE_KEY || event.key === null) {
    handleUnderlyingChange();
  }
};

const ensureInitialized = (): void => {
  if (!initialized) {
    initialized = true;
    lastKnownSub = getAuthSnapshot().sub;
  }
  if (!globalListenersWired && typeof window !== 'undefined') {
    globalListenersWired = true;
    window.addEventListener('storage', handleStorage);
    window.addEventListener(AUTH_STORE_CHANGE_EVENT, handleUnderlyingChange);
  }
};

/**
 * Cross-tab notification comes for free from the browser's own `storage`
 * event (fired in every *other* tab whenever `localStorage` changes) —
 * covering both an explicit logout (key removed) and a sign-in as a
 * different user (key overwritten) in another tab. `key === null` covers a
 * wholesale `localStorage.clear()`.
 */
export const subscribeToAuthStore = (
  onChange: ChangeListener,
): (() => void) => {
  ensureInitialized();
  changeListeners.add(onChange);
  return () => changeListeners.delete(onChange);
};

/**
 * Fires whenever the reactive `sub` actually changes (same-tab or
 * cross-tab), synchronously and ahead of any React re-render — the correct
 * place for a side effect that must not run after a component has already
 * rendered/fetched under the new identity.
 */
export const onAuthIdentityChange = (
  listener: IdentityChangeListener,
): (() => void) => {
  ensureInitialized();
  identityListeners.add(listener);
  return () => identityListeners.delete(listener);
};

/** The current authenticated identity (`sub`), reactive across tabs. */
export const useAuthSession = (): AuthSnapshot =>
  useSyncExternalStore(subscribeToAuthStore, getAuthSnapshot, getAuthSnapshot);

/**
 * Test-only escape hatch: this module holds shared, mutable snapshot/identity
 * state across every caller in the tab by design, so tests that simulate an
 * identity change must reset it explicitly instead of leaking state (e.g. a
 * stale `lastKnownSub`) across unrelated test cases.
 */
export const __resetAuthStoreForTests = (): void => {
  cachedSnapshot = { token: null, sub: null };
  cachedRawToken = undefined;
  changeListeners.clear();
  identityListeners.clear();
  initialized = false;
  lastKnownSub = null;
};
