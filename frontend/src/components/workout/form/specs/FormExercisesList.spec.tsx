import { renderWithFormik, screen, userEvent } from '@testUtils';
import { DICTIONARY } from '@locales';
import {
  BENCH_PRESS_NAME,
  PULL_UP_NAME,
  SELECT_EXERCISE_BUTTON,
  createExercise,
  createWorkoutValues,
  selectedExercise,
} from './fixtures';
import { FormExercisesList } from '../FormExercisesList';

jest.mock('@components', () => ({
  ExerciseSelect: ({
    onSelect,
  }: {
    onSelect: (exercise: typeof selectedExercise) => void;
  }) => (
    <button type="button" onClick={() => onSelect(selectedExercise)}>
      {SELECT_EXERCISE_BUTTON}
    </button>
  ),
}));

const workoutLocales = DICTIONARY.workout;

describe('FormExercisesList', () => {
  it('should render form exercise cards for current exercises', () => {
    const exercises = [
      createExercise({
        name: BENCH_PRESS_NAME,
      }),
      createExercise({
        id: 'exercise-2',
        exerciseId: 'pull-up',
        name: PULL_UP_NAME,
      }),
    ];

    renderWithFormik(<FormExercisesList />, {
      initialValues: createWorkoutValues(exercises),
    });

    expect(screen.getAllByRole('heading')).toHaveLength(exercises.length);
    expect(
      screen.getByRole('heading', {
        name: BENCH_PRESS_NAME,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: PULL_UP_NAME,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(workoutLocales.create.addExercise),
    ).toBeInTheDocument();
  });

  it('should add selected exercise to the form', async () => {
    const user = userEvent.setup();

    renderWithFormik(<FormExercisesList />, {
      initialValues: createWorkoutValues([]),
    });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: SELECT_EXERCISE_BUTTON,
      }),
    );

    expect(
      await screen.findByRole('heading', {
        name: selectedExercise.name,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.getByText(`1 ${workoutLocales.sets}`)).toBeInTheDocument();
    expect(screen.getByDisplayValue(0)).toBeInTheDocument();
    expect(screen.getByDisplayValue(1)).toBeInTheDocument();
  });

  it('should remove exercise from the form', async () => {
    const user = userEvent.setup();

    renderWithFormik(<FormExercisesList />, {
      initialValues: createWorkoutValues(),
    });

    expect(
      screen.getByRole('heading', {
        name: BENCH_PRESS_NAME,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: workoutLocales.create.removeExercise,
      }),
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
