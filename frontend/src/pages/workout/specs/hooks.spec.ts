import axios, { type AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { FormikHelpers } from 'formik';

import { ACCESS_TOKEN_STORAGE_KEY, APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { renderHook } from '@testUtils';
import type { CreateWorkoutFormValues } from '@types';
import {
  ensureFreshAccessToken,
  handleTerminalSessionFailure,
} from '@services/session';
import { useCreateWorkout } from '../create/hooks';
import { useCreateWorkoutQ } from '../queries';

jest.mock('../queries', () => ({
  useCreateWorkoutQ: jest.fn(),
}));

jest.mock('@services/session', () => ({
  ensureFreshAccessToken: jest.fn(),
  // Real passthrough to `localStorage` (mirrors the coordinator's own
  // implementation) so the owner check below reads a real, current token.
  getAccessToken: jest.fn(() => localStorage.getItem('accessToken')),
  handleTerminalSessionFailure: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('react-hot-toast', () => {
  const fn = Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() });
  return { __esModule: true, default: fn };
});

const mockToast = toast as unknown as jest.Mock & {
  success: jest.Mock;
  error: jest.Mock;
};

describe('useCreateWorkout', () => {
  const mockNavigate = jest.fn();
  const mockMutateAsync = jest.fn();
  const mockSetSubmitting = jest.fn();
  const mockOnConfirmedCreate = jest.fn();
  const mockOnIdempotencyConflict = jest.fn();
  const clientRequestId = 'client-request-id-1';
  const ownerUserId = 'user-1';
  const { create } = DICTIONARY.workout;

  const mockedNavigate = useNavigate as jest.Mock;
  const mockedUseCreateWorkoutQ = useCreateWorkoutQ as jest.Mock;
  const mockedEnsureFreshAccessToken = ensureFreshAccessToken as jest.Mock;
  const mockedHandleTerminalSessionFailure =
    handleTerminalSessionFailure as jest.Mock;

  const tokenFor = (userId: string): string =>
    `h.${btoa(JSON.stringify({ sub: userId, exp: 9999999999 }))}.s`;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor(ownerUserId));
    mockedNavigate.mockReturnValue(mockNavigate);
    mockedUseCreateWorkoutQ.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });
    mockedEnsureFreshAccessToken.mockResolvedValue({ status: 'success' });
  });

  const mockFormValues: CreateWorkoutFormValues = {
    name: 'Push Day',
    date: '2023-10-27T00:00:00.000Z',
    exercises: [
      {
        exerciseId: 'ex-1',
        sets: [
          { weight: 40, reps: 10, order: 0, isCompleted: false },
          { weight: 45, reps: 8, order: 1, isCompleted: false },
        ],
      },
    ],
  };
  const formikHelpers = {
    setSubmitting: mockSetSubmitting,
  } as unknown as FormikHelpers<CreateWorkoutFormValues>;

  const submit = (overrides: Partial<{ ownerUserId: string | null }> = {}) =>
    renderHook(() =>
      useCreateWorkout({
        clientRequestId,
        ownerUserId,
        onConfirmedCreate: mockOnConfirmedCreate,
        onIdempotencyConflict: mockOnIdempotencyConflict,
        ...overrides,
      }),
    );

  it('should refresh the session, call mutateAsync with the client request ID, clear the draft, and navigate on success', async () => {
    mockMutateAsync.mockResolvedValue({});

    const { result } = submit();

    await result.current(mockFormValues, formikHelpers);

    expect(mockedEnsureFreshAccessToken).toHaveBeenCalledTimes(1);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      name: mockFormValues.name,
      date: new Date(mockFormValues.date).toISOString(),
      clientRequestId,
      exercises: [
        {
          exerciseId: mockFormValues.exercises[0].exerciseId,
          order: 0,
          sets: [
            {
              weight: Number(mockFormValues.exercises[0].sets[0].weight),
              reps: Number(mockFormValues.exercises[0].sets[0].reps),
              order: 0,
              isCompleted: false,
            },
            {
              weight: Number(mockFormValues.exercises[0].sets[1].weight),
              reps: Number(mockFormValues.exercises[0].sets[1].reps),
              order: 1,
              isCompleted: false,
            },
          ],
        },
      ],
    });

    expect(mockOnConfirmedCreate).toHaveBeenCalledTimes(1);
    expect(mockToast.success).toHaveBeenCalledWith(create.success);
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.DASHBOARD);
    expect(mockSetSubmitting).toHaveBeenCalledWith(false);
  });

  it('should show a plain-text error toast (never a raw object) and keep the draft if mutateAsync fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Network Error'));

    const { result } = submit();

    await result.current(mockFormValues, formikHelpers);

    expect(mockToast.error).toHaveBeenCalledWith('Network Error');
    expect(typeof mockToast.error.mock.calls[0][0]).toBe('string');
    expect(mockOnConfirmedCreate).not.toHaveBeenCalled();
    expect(mockSetSubmitting).toHaveBeenCalledWith(false);
  });

  it('falls back to a generic message when nothing else is available', async () => {
    mockMutateAsync.mockRejectedValue('not-an-error-object');

    const { result } = submit();

    await result.current(mockFormValues, formikHelpers);

    expect(mockToast.error).toHaveBeenCalledWith(
      DICTIONARY.common.errors.unknown,
    );
  });

  describe('session outcome branching', () => {
    it('logs out and never attempts the mutation on a terminal session outcome', async () => {
      mockedEnsureFreshAccessToken.mockResolvedValue({
        status: 'terminal',
        code: 'SESSION_REVOKED',
      });

      const { result } = submit();

      await result.current(mockFormValues, formikHelpers);

      expect(mockedHandleTerminalSessionFailure).toHaveBeenCalledTimes(1);
      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(mockOnConfirmedCreate).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockSetSubmitting).toHaveBeenCalledWith(false);
    });

    it('shows a retryable error and keeps the draft on a transient session outcome', async () => {
      mockedEnsureFreshAccessToken.mockResolvedValue({
        status: 'transient',
        reason: 'server_error',
      });

      const { result } = submit();

      await result.current(mockFormValues, formikHelpers);

      expect(mockToast.error).toHaveBeenCalledWith(create.retryableError);
      expect(mockedHandleTerminalSessionFailure).not.toHaveBeenCalled();
      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(mockOnConfirmedCreate).not.toHaveBeenCalled();
      expect(mockSetSubmitting).toHaveBeenCalledWith(false);
    });
  });

  describe('cross-account owner check', () => {
    it('aborts without mutating or touching the draft when the current token belongs to a different user', async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-2'));

      const { result } = submit();

      await result.current(mockFormValues, formikHelpers);

      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(mockOnConfirmedCreate).not.toHaveBeenCalled();
      expect(mockOnIdempotencyConflict).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('aborts when the mount never resolved an owner', async () => {
      const { result } = submit({ ownerUserId: null });

      await result.current(mockFormValues, formikHelpers);

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('idempotency conflict', () => {
    afterEach(() => {
      // `isAxiosError`'s mocked return value is shared module state:
      // reset it explicitly so a later test/describe never inherits
      // `true` from here.
      (axios as jest.Mocked<typeof axios>).isAxiosError.mockReset();
    });

    const buildAxios409 = (data: unknown): AxiosError =>
      ({
        isAxiosError: true,
        message: 'Conflict',
        response: {
          status: 409,
          data,
          statusText: 'Conflict',
          headers: {},
          config: {} as never,
        },
      }) as unknown as AxiosError;

    it('clears the draft, informs the user, and navigates to the existing workout on a 409 IDEMPOTENCY_KEY_REUSED', async () => {
      (axios as jest.Mocked<typeof axios>).isAxiosError.mockReturnValue(true);
      const conflict = buildAxios409({
        code: 'IDEMPOTENCY_KEY_REUSED',
        workoutId: 'workout-42',
      });
      mockMutateAsync.mockRejectedValue(conflict);

      const { result } = submit();

      await result.current(mockFormValues, formikHelpers);

      expect(mockOnIdempotencyConflict).toHaveBeenCalledTimes(1);
      expect(mockOnConfirmedCreate).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        `${APP_ROUTES.WORKOUTS.ROOT}/workout-42`,
      );
      expect(mockToast.error).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(create.idempotencyConflict);
    });

    it('never auto-retries: a 409 without the expected code/workoutId falls back to a generic error', async () => {
      (axios as jest.Mocked<typeof axios>).isAxiosError.mockReturnValue(true);
      const badConflict = buildAxios409({ code: 'SOMETHING_ELSE' });
      mockMutateAsync.mockRejectedValue(badConflict);

      const { result } = submit();

      await result.current(mockFormValues, formikHelpers);

      expect(mockOnIdempotencyConflict).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});
