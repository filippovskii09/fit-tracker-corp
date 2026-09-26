interface DecodedAccessToken {
  sub?: string;
  email?: string;
  exp?: number;
}

// The access-token `exp` claim (and `sub`) is decoded client-side for
// scheduling/UI purposes only (design.md D4) — the backend remains the
// authority on validity.
const decodeAccessTokenPayload = (
  token: string | null | undefined,
): DecodedAccessToken | null => {
  if (!token) {
    return null;
  }

  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized);
    return JSON.parse(json) as DecodedAccessToken;
  } catch {
    return null;
  }
};

export const getAccessTokenExpiryMs = (
  token: string | null | undefined,
): number | null => {
  const payload = decodeAccessTokenPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return null;
  }
  return payload.exp * 1000;
};

export const getAccessTokenUserId = (
  token: string | null | undefined,
): string | null => {
  const payload = decodeAccessTokenPayload(token);
  return payload?.sub ?? null;
};

/**
 * True when the token is missing, malformed, expired, or within
 * `windowSeconds` of expiry. Failing safe (treating undecodable tokens as
 * expiring) avoids sending a critical mutation with a dead token.
 */
export const isAccessTokenExpiring = (
  token: string | null | undefined,
  windowSeconds: number,
): boolean => {
  const expiryMs = getAccessTokenExpiryMs(token);
  if (expiryMs === null) {
    return true;
  }
  return expiryMs - Date.now() <= windowSeconds * 1000;
};
