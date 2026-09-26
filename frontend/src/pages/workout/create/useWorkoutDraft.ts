import { useCallback, useEffect, useState } from 'react';

import { getAccessToken } from '@services/session';
import type { CreateWorkoutFormValues } from '@types';
import {
  clearWorkoutDraft,
  createDraftClientRequestId,
  getAccessTokenUserId,
  purgeStaleWorkoutDrafts,
  readWorkoutDraft,
  writeWorkoutDraft,
  type WorkoutDraft,
} from '@utils';

export interface UseWorkoutDraftResult {
  /** A matching draft exists and the user has not restored/discarded it yet. */
  hasPendingDraft: boolean;
  /** The user chose Restore for the current session (task 7.3 indication). */
  recovered: boolean;
  clientRequestId: string;
  /** The user id this draft/mount is bound to (used for an owner check). */
  ownerUserId: string | null;
  restore: () => CreateWorkoutFormValues | null;
  discard: () => void;
  saveDraft: (values: CreateWorkoutFormValues) => void;
  clearAfterSuccess: () => void;
}

interface DraftState {
  /** Captured once at mount, alongside the initial draft lookup. */
  mountUserId: string | null;
  pendingDraft: WorkoutDraft | null;
  clientRequestId: string;
}

/**
 * User+date-scoped workout draft lifecycle. The initial lookup — including
 * which user owns this mount — is a synchronous `localStorage`/token read
 * done once via a lazy `useState` initializer, so a default blank Formik
 * value is never rendered ahead of — and can never overwrite — a stored
 * draft. The owning user id is fixed at mount: every write re-checks it
 * against the *current* token so a mid-session account switch (e.g.
 * sign-out/sign-in in the same tab) can never save into, or read, another
 * user's draft through a stale hook instance. The caller is expected to
 * remount this hook (via a `key`) whenever the owning user or the target
 * date changes, so a fresh mount always re-derives its own draft state
 * instead of carrying over stale state from a previous owner/date.
 */
export const useWorkoutDraft = (date: string | null): UseWorkoutDraftResult => {
  const [{ mountUserId, pendingDraft, clientRequestId }, setDraftState] =
    useState<DraftState>(() => {
      const userId = getAccessTokenUserId(getAccessToken());
      const existing = date && userId ? readWorkoutDraft(userId, date) : null;
      return {
        mountUserId: userId,
        pendingDraft: existing,
        clientRequestId:
          existing?.clientRequestId ?? createDraftClientRequestId(),
      };
    });
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    purgeStaleWorkoutDrafts();
  }, []);

  /** True while the token in storage still identifies the mount-time user. */
  const isOwningUserStillActive = useCallback((): boolean => {
    if (!mountUserId) {
      return false;
    }
    return getAccessTokenUserId(getAccessToken()) === mountUserId;
  }, [mountUserId]);

  const restore = useCallback((): CreateWorkoutFormValues | null => {
    setRecovered(true);
    const values = pendingDraft?.values ?? null;
    setDraftState((prev) => ({ ...prev, pendingDraft: null }));
    return values;
  }, [pendingDraft]);

  const discard = useCallback(() => {
    if (mountUserId && date) {
      clearWorkoutDraft(mountUserId, date);
    }
    setDraftState((prev) => ({
      ...prev,
      pendingDraft: null,
      clientRequestId: createDraftClientRequestId(),
    }));
  }, [mountUserId, date]);

  const saveDraft = useCallback(
    (values: CreateWorkoutFormValues) => {
      if (!mountUserId || !date || pendingDraft) {
        return;
      }
      if (!isOwningUserStillActive()) {
        return;
      }
      writeWorkoutDraft(mountUserId, date, values, clientRequestId);
    },
    [mountUserId, date, clientRequestId, pendingDraft, isOwningUserStillActive],
  );

  const clearAfterSuccess = useCallback(() => {
    if (mountUserId && date) {
      clearWorkoutDraft(mountUserId, date);
    }
  }, [mountUserId, date]);

  return {
    hasPendingDraft: !!pendingDraft,
    recovered,
    clientRequestId,
    ownerUserId: mountUserId,
    restore,
    discard,
    saveDraft,
    clearAfterSuccess,
  };
};
