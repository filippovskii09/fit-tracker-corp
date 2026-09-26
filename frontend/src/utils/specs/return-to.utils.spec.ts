import { AUTH_RETURN_TO_KEY, AUTH_RETURN_TO_TTL_MS } from '@constants';
import {
  consumeReturnTo,
  sanitizeReturnTo,
  storeReturnTo,
} from '../return-to.utils';

describe('return-to.utils', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('sanitizeReturnTo', () => {
    it('accepts a plain internal path', () => {
      expect(sanitizeReturnTo('/workouts/create?date=2024-01-01')).toBe(
        '/workouts/create?date=2024-01-01',
      );
    });

    it.each([
      undefined,
      null,
      '',
      '//evil.example.com',
      'https://evil.example.com',
      'http://evil.example.com/x',
      'javascript:alert(1)',
      '/\\evil.example.com',
      'workouts/create',
    ])('rejects an unsafe or non-internal value: %p', (value) => {
      expect(sanitizeReturnTo(value)).toBeNull();
    });
  });

  describe('storeReturnTo / consumeReturnTo', () => {
    it('stores and returns a sanitized path once, for the same user', () => {
      storeReturnTo('/workouts/create?date=2024-01-01', 'user-1');

      expect(consumeReturnTo('user-1')).toBe(
        '/workouts/create?date=2024-01-01',
      );
      expect(localStorage.getItem(AUTH_RETURN_TO_KEY)).toBeNull();
      expect(consumeReturnTo('user-1')).toBeNull();
    });

    it('never stores an unsafe value', () => {
      storeReturnTo('https://evil.example.com', 'user-1');
      expect(localStorage.getItem(AUTH_RETURN_TO_KEY)).toBeNull();
      expect(consumeReturnTo('user-1')).toBeNull();
    });

    it('does not restore the route for a different user', () => {
      storeReturnTo('/workouts/create?date=2024-01-01', 'user-1');
      expect(consumeReturnTo('user-2')).toBeNull();
      // Consumed (and thus cleared) even when it doesn't match.
      expect(localStorage.getItem(AUTH_RETURN_TO_KEY)).toBeNull();
    });

    it('does not restore the route once it has expired', () => {
      storeReturnTo('/workouts/create?date=2024-01-01', 'user-1');

      jest
        .spyOn(Date, 'now')
        .mockReturnValue(Date.now() + AUTH_RETURN_TO_TTL_MS + 1000);

      expect(consumeReturnTo('user-1')).toBeNull();
    });

    it('returns null and still clears the stored entry when there is no signed-in user id', () => {
      storeReturnTo('/workouts/create?date=2024-01-01', 'user-1');
      expect(consumeReturnTo(null)).toBeNull();
      expect(localStorage.getItem(AUTH_RETURN_TO_KEY)).toBeNull();
    });

    it('returns null for malformed stored JSON', () => {
      localStorage.setItem(AUTH_RETURN_TO_KEY, '{not json');
      expect(consumeReturnTo('user-1')).toBeNull();
    });

    it('returns null for a malformed stored shape', () => {
      localStorage.setItem(
        AUTH_RETURN_TO_KEY,
        JSON.stringify({ path: '/workouts/create' }),
      );
      expect(consumeReturnTo('user-1')).toBeNull();
    });
  });

  describe('unbound entries (orchestrator decision: anonymous visit, no known user id)', () => {
    it('stores an unbound entry when no userId is known', () => {
      storeReturnTo('/workouts/create?date=2024-01-01', null);

      const stored = JSON.parse(
        localStorage.getItem(AUTH_RETURN_TO_KEY) ?? '{}',
      );
      expect(stored).toMatchObject({
        path: '/workouts/create?date=2024-01-01',
        userId: null,
      });
    });

    it('is consumable by any subsequently signed-in user', () => {
      storeReturnTo('/workouts/create?date=2024-01-01', null);

      expect(consumeReturnTo('whoever-signs-in-next')).toBe(
        '/workouts/create?date=2024-01-01',
      );
    });

    it('is not consumed while still anonymous (no signed-in user id yet)', () => {
      storeReturnTo('/workouts/create?date=2024-01-01', null);

      // Consistent with a bound entry: any lookup clears the stored entry,
      // matched or not, so a stale/mismatched attempt never lingers.
      expect(consumeReturnTo(null)).toBeNull();
      expect(localStorage.getItem(AUTH_RETURN_TO_KEY)).toBeNull();
    });

    it('respects the same TTL as a bound entry', () => {
      storeReturnTo('/workouts/create?date=2024-01-01', null);

      jest
        .spyOn(Date, 'now')
        .mockReturnValue(Date.now() + AUTH_RETURN_TO_TTL_MS + 1000);

      expect(consumeReturnTo('user-1')).toBeNull();
    });

    it('a bound entry still only consumes for the matching user, unaffected by the unbound rule', () => {
      storeReturnTo('/workouts/create?date=2024-01-01', 'user-1');

      expect(consumeReturnTo('user-2')).toBeNull();
    });
  });
});
