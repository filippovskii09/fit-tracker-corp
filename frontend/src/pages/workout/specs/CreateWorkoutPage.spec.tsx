import { useNavigate, useSearchParams } from 'react-router-dom';

import { ACCESS_TOKEN_STORAGE_KEY, APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { act, fireEvent, render, screen, waitFor } from '@testUtils';
import { readWorkoutDraft, writeWorkoutDraft } from '@utils';
import type { CreateWorkoutFormValues } from '@types';
import CreateWorkoutPage from '../create/CreateWorkoutPage';
import { useCreateWorkout } from '../create/hooks';

jest.mock('../create/hooks', () => ({
  useCreateWorkout: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

const tokenFor = (userId: string): string =>
  `h.${btoa(JSON.stringify({ sub: userId, exp: 9999999999 }))}.s`;

const draftValues: CreateWorkoutFormValues = {
  name: 'Recovered Push Day',
  date: '2023-10-27',
  exercises: [
    {
      exerciseId: 'ex-1',
      name: 'Bench Press',
      sets: [{ weight: 40, reps: 10, order: 0, isCompleted: false }],
    },
  ],
};

describe('CreateWorkoutPage', () => {
  const mockNavigate = jest.fn();
  const mockHandleSubmit = jest.fn();

  const mockedNavigate = useNavigate as jest.Mock;
  const mockedUseCreateWorkout = useCreateWorkout as jest.Mock;
  const mockedUseSearchParams = useSearchParams as jest.Mock;

  const mockDate = '2023-10-27';
  const basePath = '/workout/create';
  const workoutCreateLocales = DICTIONARY.workout.create;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockedNavigate.mockReturnValue(mockNavigate);
    mockedUseCreateWorkout.mockReturnValue(mockHandleSubmit);
  });

  it('should navigate to dashboard if date is missing in searchParams', () => {
    mockedUseSearchParams.mockReturnValue([new URLSearchParams('')]);

    render(<CreateWorkoutPage />, { route: basePath });

    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.DASHBOARD);
  });

  it('should render disabled submit button until an exercise is selected', async () => {
    mockedUseSearchParams.mockReturnValue([
      new URLSearchParams(`?date=${mockDate}`),
    ]);

    render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: workoutCreateLocales.submitButton,
        }),
      ).toBeDisabled();
    });
  });

  it('resets all local form/draft state when the date query param changes', async () => {
    const dateOne = '2023-10-27';
    const dateTwo = '2023-10-28';
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    mockedUseSearchParams.mockReturnValue([
      new URLSearchParams(`?date=${dateOne}`),
    ]);

    const { rerender } = render(<CreateWorkoutPage />, {
      route: `${basePath}?date=${dateOne}`,
    });

    const nameInput = await screen.findByPlaceholderText(
      workoutCreateLocales.titlePlaceholder,
    );
    fireEvent.change(nameInput, { target: { value: 'Unsaved for date one' } });
    expect(
      screen.getByDisplayValue('Unsaved for date one'),
    ).toBeInTheDocument();
    const firstClientRequestId =
      mockedUseCreateWorkout.mock.calls.at(-1)?.[0]?.clientRequestId;

    mockedUseSearchParams.mockReturnValue([
      new URLSearchParams(`?date=${dateTwo}`),
    ]);
    rerender(<CreateWorkoutPage />);

    const secondDateNameInput = await screen.findByPlaceholderText(
      workoutCreateLocales.titlePlaceholder,
    );
    expect(secondDateNameInput).toHaveValue('');
    const secondClientRequestId =
      mockedUseCreateWorkout.mock.calls.at(-1)?.[0]?.clientRequestId;
    expect(secondClientRequestId).not.toBe(firstClientRequestId);
  });

  describe('draft recovery', () => {
    beforeEach(() => {
      mockedUseSearchParams.mockReturnValue([
        new URLSearchParams(`?date=${mockDate}`),
      ]);
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    });

    it('offers Restore/Discard when a matching draft exists', async () => {
      writeWorkoutDraft('user-1', mockDate, draftValues, 'existing-id');

      render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

      expect(
        await screen.findByRole('region', {
          name: workoutCreateLocales.draft.recoveredMessage,
        }),
      ).toHaveTextContent(workoutCreateLocales.draft.recoveredMessage);
    });

    it('restoring fills the form, shows the recovered indicator, and focuses the name field', async () => {
      writeWorkoutDraft('user-1', mockDate, draftValues, 'existing-id');

      render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

      const restoreButton = await screen.findByRole('button', {
        name: workoutCreateLocales.draft.restore,
      });
      fireEvent.click(restoreButton);

      const nameInput = await screen.findByDisplayValue(draftValues.name);
      expect(nameInput).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(
        workoutCreateLocales.draft.recoveredIndicator,
      );
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
      await waitFor(() => expect(nameInput).toHaveFocus());
    });

    it('discarding removes the stored draft, the banner, and focuses the name field', async () => {
      writeWorkoutDraft('user-1', mockDate, draftValues, 'existing-id');

      render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

      const discardButton = await screen.findByRole('button', {
        name: workoutCreateLocales.draft.discard,
      });
      fireEvent.click(discardButton);

      await waitFor(() => {
        expect(screen.queryByRole('region')).not.toBeInTheDocument();
      });
      expect(readWorkoutDraft('user-1', mockDate)).toBeNull();

      const nameInput = screen.getByPlaceholderText(
        workoutCreateLocales.titlePlaceholder,
      );
      await waitFor(() => expect(nameInput).toHaveFocus());
    });

    it('passes a stable client request id to useCreateWorkout for a fresh draft', async () => {
      render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

      await waitFor(() => {
        const lastCall = mockedUseCreateWorkout.mock.calls.at(-1)?.[0];
        expect(lastCall?.clientRequestId).toEqual(expect.any(String));
        expect(lastCall?.clientRequestId).not.toBe('');
        expect(lastCall?.onConfirmedCreate).toEqual(expect.any(Function));
      });
    });
  });

  describe('implicit discard on first edit', () => {
    beforeEach(() => {
      mockedUseSearchParams.mockReturnValue([
        new URLSearchParams(`?date=${mockDate}`),
      ]);
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
    });

    it('drops the stale draft, issues a new clientRequestId, and hides the banner on the first real edit', async () => {
      writeWorkoutDraft('user-1', mockDate, draftValues, 'existing-id');

      render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

      expect(await screen.findByRole('region')).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText(
        workoutCreateLocales.titlePlaceholder,
      );
      fireEvent.change(nameInput, { target: { value: 'My Own Workout' } });

      await waitFor(() => {
        expect(screen.queryByRole('region')).not.toBeInTheDocument();
      });
      expect(readWorkoutDraft('user-1', mockDate)).toBeNull();

      const lastCall = mockedUseCreateWorkout.mock.calls.at(-1)?.[0];
      expect(lastCall?.clientRequestId).toEqual(expect.any(String));
      expect(lastCall?.clientRequestId).not.toBe('existing-id');
    });

    it('keeps the same clientRequestId when Restore is used instead of editing', async () => {
      writeWorkoutDraft('user-1', mockDate, draftValues, 'existing-id');

      render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

      const restoreButton = await screen.findByRole('button', {
        name: workoutCreateLocales.draft.restore,
      });
      fireEvent.click(restoreButton);

      await waitFor(() => {
        const lastCall = mockedUseCreateWorkout.mock.calls.at(-1)?.[0];
        expect(lastCall?.clientRequestId).toBe('existing-id');
      });
    });
  });

  describe('debounced autosave', () => {
    beforeEach(() => {
      mockedUseSearchParams.mockReturnValue([
        new URLSearchParams(`?date=${mockDate}`),
      ]);
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenFor('user-1'));
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('never persists a draft for untouched default values on mount', async () => {
      render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

      // Flushes Formik's own `validateOnMount` microtask under `act` before
      // any fake-timer advance, so it never lands as an unwrapped update.
      await screen.findByPlaceholderText(workoutCreateLocales.titlePlaceholder);

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(readWorkoutDraft('user-1', mockDate)).toBeNull();
    });

    it('persists a debounced draft only after a real edit', async () => {
      render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

      const nameInput = await screen.findByPlaceholderText(
        workoutCreateLocales.titlePlaceholder,
      );

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Leg Day' } });
        await Promise.resolve();
      });

      // Not yet persisted before the debounce window elapses.
      expect(readWorkoutDraft('user-1', mockDate)).toBeNull();

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(readWorkoutDraft('user-1', mockDate)).toMatchObject({
        values: expect.objectContaining({ name: 'Leg Day' }),
      });
    });

    it('does not re-persist the discarded draft on its own after Discard', async () => {
      writeWorkoutDraft('user-1', mockDate, draftValues, 'existing-id');

      render(<CreateWorkoutPage />, { route: `${basePath}?date=${mockDate}` });

      const discardButton = await screen.findByRole('button', {
        name: workoutCreateLocales.draft.discard,
      });

      await act(async () => {
        fireEvent.click(discardButton);
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(readWorkoutDraft('user-1', mockDate)).toBeNull();
    });
  });
});
