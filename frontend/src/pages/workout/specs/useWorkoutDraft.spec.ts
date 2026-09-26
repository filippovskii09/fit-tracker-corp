import { ACCESS_TOKEN_STORAGE_KEY } from '@constants';
import { act, renderHook } from '@testUtils';
import { readWorkoutDraft, writeWorkoutDraft } from '@utils';
import type { CreateWorkoutFormValues } from '@types';
import { useWorkoutDraft } from '../create/useWorkoutDraft';

const tokenFor = (userId: string): string =>
  `h.${btoa(JSON.stringify({ sub: userId, exp: 9999999999 }))}.s`;

const values: CreateWorkoutFormValues = {
  name: 'Leg Day',
  date: '2024-01-01',
  exercises: [],
};

describe('useWorkoutDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // The draft lookup is a synchronous lazy `useState` initializer, so every
  // assertion below reads the hook's result immediately after `renderHook`
  // — there is nothing asynchronous to wait for.

  it('has no pending draft when nothing is stored', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));

    const { result } = renderHook(() => useWorkoutDraft('2024-01-01'));

    expect(result.current.hasPendingDraft).toBe(false);
    expect(result.current.clientRequestId).toBeTruthy();
  });

  it('has no pending draft when there is no date or no authenticated user', () => {
    const { result } = renderHook(() => useWorkoutDraft(null));
    expect(result.current.hasPendingDraft).toBe(false);
  });

  it('surfaces a matching stored draft as pending until a decision is made', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    writeWorkoutDraft('user-1', '2024-01-01', values, 'existing-request-id');

    const { result } = renderHook(() => useWorkoutDraft('2024-01-01'));

    expect(result.current.hasPendingDraft).toBe(true);
    expect(result.current.clientRequestId).toBe('existing-request-id');
  });

  it('restore() returns the stored values, marks recovered, and clears the pending state', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    writeWorkoutDraft('user-1', '2024-01-01', values, 'existing-request-id');

    const { result } = renderHook(() => useWorkoutDraft('2024-01-01'));
    expect(result.current.hasPendingDraft).toBe(true);

    let restored: CreateWorkoutFormValues | null = null;
    act(() => {
      restored = result.current.restore();
    });

    expect(restored).toEqual(values);
    expect(result.current.recovered).toBe(true);
    expect(result.current.hasPendingDraft).toBe(false);
  });

  it('discard() removes the stored draft and issues a fresh client request id', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    writeWorkoutDraft('user-1', '2024-01-01', values, 'existing-request-id');

    const { result } = renderHook(() => useWorkoutDraft('2024-01-01'));
    const idBeforeDiscard = result.current.clientRequestId;

    act(() => {
      result.current.discard();
    });

    expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
    expect(result.current.hasPendingDraft).toBe(false);
    expect(result.current.clientRequestId).not.toBe(idBeforeDiscard);
  });

  it('saveDraft() persists values once there is no pending decision', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));

    const { result } = renderHook(() => useWorkoutDraft('2024-01-01'));

    result.current.saveDraft(values);

    expect(readWorkoutDraft('user-1', '2024-01-01')).toMatchObject({
      values,
    });
  });

  it('saveDraft() is a no-op while a draft is still pending restore/discard', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    writeWorkoutDraft('user-1', '2024-01-01', values, 'existing-request-id');

    const { result } = renderHook(() => useWorkoutDraft('2024-01-01'));
    expect(result.current.hasPendingDraft).toBe(true);

    const overwrite = { ...values, name: 'Should Not Save' };
    result.current.saveDraft(overwrite);

    expect(readWorkoutDraft('user-1', '2024-01-01')).toMatchObject({
      values,
    });
  });

  it('clearAfterSuccess() removes the draft for the current user/date', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));

    const { result } = renderHook(() => useWorkoutDraft('2024-01-01'));

    result.current.saveDraft(values);
    expect(readWorkoutDraft('user-1', '2024-01-01')).not.toBeNull();

    result.current.clearAfterSuccess();
    expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
  });

  it("never surfaces another user's draft", () => {
    writeWorkoutDraft('user-1', '2024-01-01', values, 'req-1');
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-2'));

    const { result } = renderHook(() => useWorkoutDraft('2024-01-01'));

    expect(result.current.hasPendingDraft).toBe(false);
  });

  it('autosaving a cleared number field (Formik leaves it as "") survives a remount with the same identity/date', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    const valuesWithClearedWeight = {
      name: 'Leg Day',
      date: '2024-01-01',
      exercises: [
        {
          exerciseId: 'ex-1',
          sets: [{ weight: '', reps: 10, order: 0, isCompleted: false }],
        },
      ],
    } as unknown as CreateWorkoutFormValues;

    const first = renderHook(() => useWorkoutDraft('2024-01-01'));
    first.result.current.saveDraft(valuesWithClearedWeight);
    first.unmount();

    const second = renderHook(() => useWorkoutDraft('2024-01-01'));
    expect(second.result.current.hasPendingDraft).toBe(true);
    let restored: CreateWorkoutFormValues | null = null;
    act(() => {
      restored = second.result.current.restore();
    });

    expect(restored).toEqual(valuesWithClearedWeight);
  });

  it('saveDraft() writes nothing for either user once the token is swapped mid-session', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));

    const { result } = renderHook(() => useWorkoutDraft('2024-01-01'));

    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-2'));
    result.current.saveDraft(values);

    expect(readWorkoutDraft('user-1', '2024-01-01')).toBeNull();
    expect(readWorkoutDraft('user-2', '2024-01-01')).toBeNull();
  });

  it('exposes the owning user id for a cross-account submit-time check', () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));

    const { result } = renderHook(() => useWorkoutDraft('2024-01-01'));

    expect(result.current.ownerUserId).toBe('user-1');
  });

  describe('clientRequestId stability across the mounted hook instance', () => {
    it('reuses the same clientRequestId as the saved draft', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));

      const { result, rerender } = renderHook(() =>
        useWorkoutDraft('2024-01-01'),
      );

      result.current.saveDraft(values);
      const savedId = readWorkoutDraft('user-1', '2024-01-01')?.clientRequestId;

      expect(savedId).toBe(result.current.clientRequestId);

      rerender();
      expect(result.current.clientRequestId).toBe(savedId);
    });

    it('remounting with the same token and date surfaces the same pending draft id', () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
      writeWorkoutDraft('user-1', '2024-01-01', values, 'stable-id');

      const first = renderHook(() => useWorkoutDraft('2024-01-01'));
      expect(first.result.current.hasPendingDraft).toBe(true);
      expect(first.result.current.clientRequestId).toBe('stable-id');
      first.unmount();

      const second = renderHook(() => useWorkoutDraft('2024-01-01'));
      expect(second.result.current.hasPendingDraft).toBe(true);
      expect(second.result.current.clientRequestId).toBe('stable-id');
    });
  });
});
