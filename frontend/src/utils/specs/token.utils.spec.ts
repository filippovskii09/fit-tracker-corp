import {
  getAccessTokenExpiryMs,
  getAccessTokenUserId,
  isAccessTokenExpiring,
} from '../token.utils';

const base64Url = (value: object): string =>
  btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const buildToken = (payload: object): string =>
  `header.${base64Url(payload)}.signature`;

describe('token.utils', () => {
  describe('getAccessTokenExpiryMs', () => {
    it('returns null for a missing token', () => {
      expect(getAccessTokenExpiryMs(null)).toBeNull();
      expect(getAccessTokenExpiryMs(undefined)).toBeNull();
    });

    it('returns null for a malformed token', () => {
      expect(getAccessTokenExpiryMs('not-a-jwt')).toBeNull();
      expect(getAccessTokenExpiryMs('a.b.c'.replace('b', '!!!'))).toBeNull();
    });

    it('decodes the exp claim to milliseconds', () => {
      const exp = 1_700_000_000;
      const token = buildToken({ sub: 'user-1', exp });
      expect(getAccessTokenExpiryMs(token)).toBe(exp * 1000);
    });
  });

  describe('getAccessTokenUserId', () => {
    it('returns the sub claim', () => {
      const token = buildToken({ sub: 'user-42', exp: 1 });
      expect(getAccessTokenUserId(token)).toBe('user-42');
    });

    it('returns null when there is no token', () => {
      expect(getAccessTokenUserId(null)).toBeNull();
    });
  });

  describe('isAccessTokenExpiring', () => {
    it('treats an undecodable token as expiring (fail safe)', () => {
      expect(isAccessTokenExpiring('garbage', 60)).toBe(true);
      expect(isAccessTokenExpiring(null, 60)).toBe(true);
    });

    it('is false when the token is well outside the refresh window', () => {
      const token = buildToken({
        sub: 'user-1',
        exp: Math.floor((Date.now() + 10 * 60 * 1000) / 1000),
      });
      expect(isAccessTokenExpiring(token, 60)).toBe(false);
    });

    it('is true when the token is within the refresh window', () => {
      const token = buildToken({
        sub: 'user-1',
        exp: Math.floor((Date.now() + 30 * 1000) / 1000),
      });
      expect(isAccessTokenExpiring(token, 60)).toBe(true);
    });

    it('is true when the token already expired', () => {
      const token = buildToken({
        sub: 'user-1',
        exp: Math.floor((Date.now() - 60 * 1000) / 1000),
      });
      expect(isAccessTokenExpiring(token, 60)).toBe(true);
    });
  });
});
