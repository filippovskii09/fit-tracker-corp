import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { FormikHelpers } from 'formik';

import { APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { renderHook } from '@testUtils';
import type { CreateWorkoutFormValues } from '@types';
import { useCreateWorkout } from '../create/hooks';
import { useCreateWorkoutQ } from '../queries';

jest.mock('../queries', () => ({
  useCreateWorkoutQ: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('useCreateWorkout', () => {
  const mockNavigate = jest.fn();
  const mockMutateAsync = jest.fn();
  const mockSetSubmitting = jest.fn();

  const mockedNavigate = useNavigate as jest.Mock;
  const mockedUseCreateWorkoutQ = useCreateWorkoutQ as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigate.mockReturnValue(mockNavigate);
    mockedUseCreateWorkoutQ.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });
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

  it('should call mutateAsync with correctly formatted payload and navigate on success', async () => {
    mockMutateAsync.mockResolvedValue({});

    const { result } = renderHook(() => useCreateWorkout());

    await result.current(mockFormValues, formikHelpers);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      name: mockFormValues.name,
      date: new Date(mockFormValues.date).toISOString(),
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

    expect(toast.success).toHaveBeenCalledWith(
      DICTIONARY.workout.create.success,
    );
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.DASHBOARD);
    expect(mockSetSubmitting).toHaveBeenCalledWith(false);
  });

  it('should show error toast if mutateAsync fails', async () => {
    const errorData = 'Network Error';
    const mockError = { response: { data: errorData } };
    mockMutateAsync.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCreateWorkout());

    await result.current(mockFormValues, formikHelpers);

    expect(toast.error).toHaveBeenCalledWith(errorData);
    expect(mockSetSubmitting).toHaveBeenCalledWith(false);
  });
});
