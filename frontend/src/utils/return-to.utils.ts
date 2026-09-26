import { AUTH_RETURN_TO_KEY, AUTH_RETURN_TO_TTL_MS } from '@constants';

/**
 * Only an internal, single-leading-slash path is ever accepted as a return
 * route (task 6.6). Rejects protocol-relative (`//host`), absolute
 * (`https://...`), and backslash-based open-redirect payloads.
 */
export const sanitizeReturnTo = (
  value: string | null | undefined,
): string | null => {
  if (!value) {
    return null;
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  if (value.includes('\\') || /^\/\s*\/?\s*[a-z]+:/i.test(value)) {
    return null;
  }

  try {
    // A relative path resolved against a fixed dummy origin must stay on
    // that origin; otherwise the value smuggled a scheme/host.
    const resolved = new URL(value, 'https://internal.invalid');
    if (resolved.origin !== 'https://internal.invalid') {
      return null;
    }
  } catch {
    return null;
  }

  return value;
};

interface StoredReturnTo {
  path: string;
  // `null` marks an *unbound* entry (orchestrator decision): a fully
  // anonymous visit to a protected route never had a decodable user id to
  // bind to, so any subsequent sign-in — not just one specific user — may
  // consume it. A known expiring user's route stays bound to that user.
  userId: string | null;
  createdAt: number;
}

const isStoredReturnTo = (value: unknown): value is StoredReturnTo => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.path === 'string' &&
    (candidate.userId === null || typeof candidate.userId === 'string') &&
    typeof candidate.createdAt === 'number'
  );
};

/**
 * Binds the preserved route to the user whose session just failed, or
 * leaves it unbound when there is no known user id (a never-signed-in
 * visit) — either way a different/later sign-in can't smuggle an unsafe
 * value, and a bound entry never lands on someone else's in-progress route.
 */
export const storeReturnTo = (path: string, userId: string | null): void => {
  const safe = sanitizeReturnTo(path);
  if (!safe) {
    return;
  }

  const payload: StoredReturnTo = {
    path: safe,
    userId: userId || null,
    createdAt: Date.now(),
  };
  localStorage.setItem(AUTH_RETURN_TO_KEY, JSON.stringify(payload));
};

/**
 * Returns the preserved route when it hasn't expired and — for a bound
 * entry — the newly signed-in user matches the one the route was captured
 * for; an unbound entry (orchestrator decision) is returned for any
 * signed-in user. Always clears the stored entry, so a mismatched or
 * already-consumed lookup never lingers for a later attempt.
 */
export const consumeReturnTo = (userId: string | null): string | null => {
  const raw = localStorage.getItem(AUTH_RETURN_TO_KEY);
  localStorage.removeItem(AUTH_RETURN_TO_KEY);

  if (!raw || !userId) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isStoredReturnTo(parsed)) {
    return null;
  }

  if (parsed.userId !== null && parsed.userId !== userId) {
    return null;
  }

  if (Date.now() - parsed.createdAt > AUTH_RETURN_TO_TTL_MS) {
    return null;
  }

  return sanitizeReturnTo(parsed.path);
};
