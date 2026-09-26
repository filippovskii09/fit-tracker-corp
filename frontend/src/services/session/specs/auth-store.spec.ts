import { ACCESS_TOKEN_STORAGE_KEY } from '@constants';
import { act, renderHook } from '@testUtils';
import {
  AUTH_STORE_CHANGE_EVENT,
  getAuthSnapshot,
  notifyAuthStoreChanged,
  useAuthSession,
} from '../auth-store';

const tokenFor = (userId: string): string =>
  `h.${btoa(JSON.stringify({ sub: userId, exp: 9999999999 }))}.s`;

describe('auth-store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads no token/sub when nothing is stored', () => {
    expect(getAuthSnapshot()).toEqual({ token: null, sub: null });
  });

  it('decodes the current token and sub', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    expect(getAuthSnapshot()).toEqual({
      token: tokenFor('user-1'),
      sub: 'user-1',
    });
  });

  it('returns the same snapshot reference across calls when the token has not changed', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    const first = getAuthSnapshot();
    const second = getAuthSnapshot();
    expect(first).toBe(second);
  });

  it('re-renders subscribers on the same-tab change event', () => {
    const { result } = renderHook(() => useAuthSession());
    expect(result.current.sub).toBeNull();

    act(() => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
      notifyAuthStoreChanged();
    });

    expect(result.current.sub).toBe('user-1');
  });

  it('re-renders subscribers on a cross-tab storage event for the access-token key', () => {
    const { result } = renderHook(() => useAuthSession());

    act(() => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-2'));
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: ACCESS_TOKEN_STORAGE_KEY,
          newValue: tokenFor('user-2'),
        }),
      );
    });

    expect(result.current.sub).toBe('user-2');
  });

  it('re-renders on a wholesale localStorage.clear() (storage event key === null)', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    const { result } = renderHook(() => useAuthSession());
    expect(result.current.sub).toBe('user-1');

    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });

    expect(result.current.sub).toBeNull();
  });

  it('ignores unrelated storage keys', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    const { result } = renderHook(() => useAuthSession());

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'unrelated', newValue: 'x' }),
      );
    });

    expect(result.current.sub).toBe('user-1');
  });

  it('AUTH_STORE_CHANGE_EVENT is dispatched by notifyAuthStoreChanged', () => {
    const handler = jest.fn();
    window.addEventListener(AUTH_STORE_CHANGE_EVENT, handler);

    notifyAuthStoreChanged();

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_STORE_CHANGE_EVENT, handler);
  });
});
