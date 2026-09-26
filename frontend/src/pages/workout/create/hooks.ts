import axios from 'axios';
import type { FormikHelpers } from 'formik';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import {
  ensureFreshAccessToken,
  getAccessToken,
  handleTerminalSessionFailure,
} from '@services/session';
import type { CreateWorkoutFormValues, IExercise, ISet } from '@types';
import { getAccessTokenUserId, getErrorMessage } from '@utils';
import { useCreateWorkoutQ } from '../queries';

interface UseCreateWorkoutOptions {
  clientRequestId: string;
  /** The user this mounted form/draft belongs to (owner check below). */
  ownerUserId: string | null;
  onConfirmedCreate: () => void;
  /** Called when the backend reports the draft was already saved under a
   * different payload (409 `IDEMPOTENCY_KEY_REUSED`) so the stale local
   * draft is dropped too. */
  onIdempotencyConflict: () => void;
}

interface IdempotencyConflictBody {
  code?: string;
  workoutId?: string;
}

const getIdempotencyConflict = (
  error: unknown,
): IdempotencyConflictBody | null => {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) {
    return null;
  }
  const data = error.response.data as IdempotencyConflictBody | undefined;
  if (data?.code !== 'IDEMPOTENCY_KEY_REUSED' || !data.workoutId) {
    return null;
  }
  return data;
};

export const useCreateWorkout = ({
  clientRequestId,
  ownerUserId,
  onConfirmedCreate,
  onIdempotencyConflict,
}: UseCreateWorkoutOptions) => {
  const navigate = useNavigate();
  const { create } = DICTIONARY.workout;

  const mutate = useCreateWorkoutQ();

  const handleSubmit = async (
    values: CreateWorkoutFormValues,
    { setSubmitting }: FormikHelpers<CreateWorkoutFormValues>,
  ) => {
    try {
      // Expiry-aware critical mutation (design.md D4, task 6.2): refresh
      // first when the access token is expired or near expiry so the save
      // itself doesn't race an avoidable 401.
      const sessionOutcome = await ensureFreshAccessToken();

      if (sessionOutcome.status === 'terminal') {
        // Confirmed terminal failure (design.md D5): clear the session and
        // redirect; the draft is preserved and the mutation never runs.
        handleTerminalSessionFailure();
        return;
      }

      if (sessionOutcome.status === 'transient') {
        // Network/429/5xx: keep the draft and let the user retry instead of
        // attempting a save with a stale/expired token.
        toast.error(create.retryableError);
        return;
      }

      // Owner check, right before the mutation: a cross-tab logout/sign-in
      // as a different user could have replaced the token underneath this
      // still-mounted form. Abort without mutating and without touching the
      // draft — it belongs to `ownerUserId`, not whoever is now signed in.
      const currentUserId = getAccessTokenUserId(getAccessToken());
      if (!ownerUserId || currentUserId !== ownerUserId) {
        toast.error(create.retryableError);
        return;
      }

      const payload = {
        name: values.name,
        date: new Date(values.date).toISOString(),
        exercises: values.exercises.map((ex: IExercise, index: number) => ({
          exerciseId: ex.exerciseId,
          order: index,
          sets: ex.sets.map((s: ISet, setIndex: number) => ({
            weight: Number(s.weight),
            reps: Number(s.reps),
            order: setIndex,
            isCompleted: false,
          })),
        })),
        // Idempotency key (design.md D7): a retried submit for the same
        // draft resolves to the originally created workout instead of a
        // duplicate.
        clientRequestId,
      };

      await mutate.mutateAsync(payload);
      // Only a confirmed create clears the draft (design.md D6/D7, task
      // 7.4); any thrown error below leaves it in place for retry.
      onConfirmedCreate();
      toast.success(create.success);
      navigate(APP_ROUTES.DASHBOARD);
    } catch (error: unknown) {
      const conflict = getIdempotencyConflict(error);
      if (conflict?.workoutId) {
        // An earlier version of this draft was already saved under this
        // clientRequestId: the local draft is
        // now stale, never auto-retried — send the user to the workout that
        // actually exists.
        onIdempotencyConflict();
        toast(create.idempotencyConflict);
        navigate(`${APP_ROUTES.WORKOUTS.ROOT}/${conflict.workoutId}`);
        return;
      }
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return handleSubmit;
};
