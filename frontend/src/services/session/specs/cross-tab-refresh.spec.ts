import {
  AUTH_LOGOUT_BROADCAST_KEY,
  AUTH_REFRESH_LEASE_KEY,
  AUTH_REFRESH_RESULT_FRESHNESS_MS,
  AUTH_REFRESH_RESULT_KEY,
} from '@constants';
import type { SessionOutcome } from '@types';
import {
  acquireRefreshLease,
  broadcastLogout,
  broadcastRefreshOutcome,
  releaseRefreshLease,
  subscribeToLogoutBroadcast,
  tryAcquireRefreshLease,
  waitForRefreshOutcome,
} from '../cross-tab-refresh';

class FakeBroadcastChannel {
  static channels: Record<string, Set<FakeBroadcastChannel>> = {};
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private closed = false;

  constructor(name: string) {
    this.name = name;
    FakeBroadcastChannel.channels[name] ??= new Set();
    FakeBroadcastChannel.channels[name].add(this);
  }

  postMessage(data: unknown) {
    FakeBroadcastChannel.channels[this.name]?.forEach((instance) => {
      if (instance !== this && !instance.closed) {
        instance.onmessage?.({ data } as MessageEvent);
      }
    });
  }

  close() {
    this.closed = true;
    FakeBroadcastChannel.channels[this.name]?.delete(this);
  }
}

describe('cross-tab-refresh (localStorage lease / storage-event fallback)', () => {
  const originalBroadcastChannel = (
    globalThis as { BroadcastChannel?: unknown }
  ).BroadcastChannel;

  beforeEach(() => {
    localStorage.clear();
    // Exercise the no-BroadcastChannel fallback path explicitly (task 6.3).
    delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
  });

  afterEach(() => {
    (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel =
      originalBroadcastChannel;
  });

  describe('lease', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('grants the lease when the stored entry is malformed JSON', () => {
      localStorage.setItem(AUTH_REFRESH_LEASE_KEY, '{not json');
      expect(tryAcquireRefreshLease()).toBe(true);
    });

    it('grants the lease when none is held', () => {
      expect(tryAcquireRefreshLease()).toBe(true);
      expect(localStorage.getItem(AUTH_REFRESH_LEASE_KEY)).not.toBeNull();
    });

    it('denies the lease to a would-be second owner while it is held and unexpired', () => {
      localStorage.setItem(
        AUTH_REFRESH_LEASE_KEY,
        JSON.stringify({ id: 'other-tab', expiresAt: Date.now() + 8000 }),
      );

      expect(tryAcquireRefreshLease()).toBe(false);
    });

    it('grants the lease once a held one has expired', () => {
      localStorage.setItem(
        AUTH_REFRESH_LEASE_KEY,
        JSON.stringify({ id: 'other-tab', expiresAt: Date.now() - 1 }),
      );

      expect(tryAcquireRefreshLease()).toBe(true);
    });

    it('only releases a lease this module owns', () => {
      tryAcquireRefreshLease();
      localStorage.setItem(
        AUTH_REFRESH_LEASE_KEY,
        JSON.stringify({ id: 'someone-else', expiresAt: Date.now() + 8000 }),
      );

      releaseRefreshLease();

      expect(localStorage.getItem(AUTH_REFRESH_LEASE_KEY)).not.toBeNull();
    });

    it('reports false when a concurrent writer clobbers the attempt between the write and the confirming re-read', () => {
      const realGetItem = Storage.prototype.getItem;
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      getItemSpy
        // The initial check before acquiring: nothing held yet.
        .mockImplementationOnce(function (this: Storage, key: string) {
          return realGetItem.call(this, key);
        })
        // The confirming re-read: a different tab's attempt "won" the race
        // in the same tick.
        .mockImplementationOnce(() =>
          JSON.stringify({
            id: 'other-tab',
            attempt: 'clobbered-it',
            expiresAt: Date.now() + 8000,
          }),
        );

      const result = tryAcquireRefreshLease();

      expect(result).toBe(false);
    });
  });

  describe('broadcastRefreshOutcome / waitForRefreshOutcome', () => {
    it('resolves with the outcome mirrored to localStorage via the storage event', async () => {
      const outcome: SessionOutcome = {
        status: 'success',
        accessToken: 'tab-a-token',
      };

      const waiting = waitForRefreshOutcome(1000);

      broadcastRefreshOutcome(outcome);
      const persisted = JSON.parse(
        localStorage.getItem(AUTH_REFRESH_RESULT_KEY) ?? '{}',
      );
      expect(persisted.outcome).toEqual(outcome);
      expect(typeof persisted.emittedAt).toBe('number');

      // jsdom does not dispatch `storage` events for same-document writes,
      // so simulate the cross-tab notification the browser sends to other
      // tabs.
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: AUTH_REFRESH_RESULT_KEY,
          newValue: localStorage.getItem(AUTH_REFRESH_RESULT_KEY),
        }),
      );

      await expect(waiting).resolves.toEqual(outcome);
    });

    it('resolves with null when nothing arrives before the timeout', async () => {
      await expect(waitForRefreshOutcome(10)).resolves.toBeNull();
    });

    it('ignores unrelated storage events', async () => {
      const waiting = waitForRefreshOutcome(20);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'unrelated-key',
          newValue: 'noise',
        }),
      );

      await expect(waiting).resolves.toBeNull();
    });

    it('treats malformed JSON in a storage event as no outcome', async () => {
      const waiting = waitForRefreshOutcome(20);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: AUTH_REFRESH_RESULT_KEY,
          newValue: '{not json',
        }),
      );

      await expect(waiting).resolves.toBeNull();
    });
  });

  describe('pre-persisted outcome check', () => {
    it('adopts an already-fresh persisted outcome immediately, without waiting', async () => {
      const outcome: SessionOutcome = {
        status: 'success',
        accessToken: 'already-there',
      };
      localStorage.setItem(
        AUTH_REFRESH_RESULT_KEY,
        JSON.stringify({ outcome, emittedAt: Date.now() }),
      );

      await expect(waitForRefreshOutcome(50)).resolves.toEqual(outcome);
    });

    it('ignores a stale persisted outcome (older than the freshness window) and waits instead', async () => {
      const outcome: SessionOutcome = {
        status: 'success',
        accessToken: 'stale',
      };
      localStorage.setItem(
        AUTH_REFRESH_RESULT_KEY,
        JSON.stringify({
          outcome,
          emittedAt: Date.now() - AUTH_REFRESH_RESULT_FRESHNESS_MS - 1,
        }),
      );

      await expect(waitForRefreshOutcome(20)).resolves.toBeNull();
    });

    it('ignores a persisted entry with no emittedAt and waits instead', async () => {
      localStorage.setItem(
        AUTH_REFRESH_RESULT_KEY,
        JSON.stringify({ status: 'success', accessToken: 'legacy-shape' }),
      );

      await expect(waitForRefreshOutcome(20)).resolves.toBeNull();
    });
  });

  describe('BroadcastChannel primary path', () => {
    beforeEach(() => {
      FakeBroadcastChannel.channels = {};
      (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel =
        FakeBroadcastChannel as unknown as typeof BroadcastChannel;
    });

    it('delivers the outcome to a waiting tab via BroadcastChannel', async () => {
      const outcome: SessionOutcome = {
        status: 'success',
        accessToken: 'via-broadcast-channel',
      };

      const waiting = waitForRefreshOutcome(1000);
      broadcastRefreshOutcome(outcome);

      await expect(waiting).resolves.toEqual(outcome);
    });

    it('still mirrors the outcome to localStorage even when BroadcastChannel is available', () => {
      const outcome: SessionOutcome = {
        status: 'terminal',
        code: 'SESSION_REVOKED',
      };

      broadcastRefreshOutcome(outcome);

      const persisted = JSON.parse(
        localStorage.getItem(AUTH_REFRESH_RESULT_KEY) ?? '{}',
      );
      expect(persisted.outcome).toEqual(outcome);
    });
  });

  describe('acquireRefreshLease', () => {
    it('runs the owner function and releases the fallback lease on success', async () => {
      const result = await acquireRefreshLease(async () => 'owned-value');

      expect(result).toEqual({ acquired: true, value: 'owned-value' });
      expect(localStorage.getItem(AUTH_REFRESH_LEASE_KEY)).toBeNull();
    });

    it('reports not-acquired when another tab already holds the fallback lease', async () => {
      localStorage.setItem(
        AUTH_REFRESH_LEASE_KEY,
        JSON.stringify({
          id: 'other-tab',
          attempt: 'x',
          expiresAt: Date.now() + 8000,
        }),
      );

      const ownerFn = jest.fn();
      const result = await acquireRefreshLease(ownerFn);

      expect(result).toEqual({ acquired: false });
      expect(ownerFn).not.toHaveBeenCalled();
    });

    it('releases the lease even when the owner function throws', async () => {
      await expect(
        acquireRefreshLease(async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      expect(localStorage.getItem(AUTH_REFRESH_LEASE_KEY)).toBeNull();
    });

    describe('navigator.locks primary path', () => {
      const originalLocks = (navigator as { locks?: unknown }).locks;

      afterEach(() => {
        if (originalLocks === undefined) {
          delete (navigator as { locks?: unknown }).locks;
        } else {
          Object.defineProperty(navigator, 'locks', {
            value: originalLocks,
            configurable: true,
          });
        }
      });

      it('runs ownerFn and requests the lock with ifAvailable when granted, never touching the fallback lease', async () => {
        const requestSpy = jest.fn(
          async (
            _name: string,
            _options: unknown,
            callback: (lock: { name: string } | null) => unknown,
          ) => callback({ name: _name }),
        );
        Object.defineProperty(navigator, 'locks', {
          value: { request: requestSpy },
          configurable: true,
        });

        const ownerFn = jest.fn(async () => 'owned-via-web-locks');
        const result = await acquireRefreshLease(ownerFn);

        expect(result).toEqual({
          acquired: true,
          value: 'owned-via-web-locks',
        });
        expect(ownerFn).toHaveBeenCalledTimes(1);
        expect(requestSpy).toHaveBeenCalledWith(
          expect.any(String),
          { ifAvailable: true },
          expect.any(Function),
        );
        expect(localStorage.getItem(AUTH_REFRESH_LEASE_KEY)).toBeNull();
      });

      it('never calls ownerFn (no network attempt) when the lock is not granted', async () => {
        Object.defineProperty(navigator, 'locks', {
          value: {
            request: jest.fn(
              async (
                _name: string,
                _options: unknown,
                callback: (lock: null) => unknown,
              ) => callback(null),
            ),
          },
          configurable: true,
        });

        const ownerFn = jest.fn();
        const result = await acquireRefreshLease(ownerFn);

        expect(result).toEqual({ acquired: false });
        expect(ownerFn).not.toHaveBeenCalled();
        expect(localStorage.getItem(AUTH_REFRESH_LEASE_KEY)).toBeNull();
      });
    });
  });

  describe('broadcastLogout / subscribeToLogoutBroadcast', () => {
    it('notifies a subscriber via the storage event', () => {
      const onLogout = jest.fn();
      const unsubscribe = subscribeToLogoutBroadcast(onLogout);

      broadcastLogout();
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: AUTH_LOGOUT_BROADCAST_KEY,
          newValue: localStorage.getItem(AUTH_LOGOUT_BROADCAST_KEY),
        }),
      );

      expect(onLogout).toHaveBeenCalledTimes(1);
      unsubscribe();
    });

    it('ignores unrelated storage keys', () => {
      const onLogout = jest.fn();
      const unsubscribe = subscribeToLogoutBroadcast(onLogout);

      window.dispatchEvent(
        new StorageEvent('storage', { key: 'unrelated', newValue: 'x' }),
      );

      expect(onLogout).not.toHaveBeenCalled();
      unsubscribe();
    });

    it('delivers the logout event via BroadcastChannel when available', () => {
      (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel =
        FakeBroadcastChannel as unknown as typeof BroadcastChannel;

      const onLogout = jest.fn();
      const unsubscribe = subscribeToLogoutBroadcast(onLogout);

      broadcastLogout();

      expect(onLogout).toHaveBeenCalledTimes(1);
      unsubscribe();
    });
  });
});
