import { renderWithFormik, screen, userEvent } from '@testUtils';
import { DICTIONARY } from '@locales';
import {
  BENCH_PRESS_NAME,
  completedSet,
  createExercise,
  createWorkoutValues,
  extraSet,
} from './fixtures';
import { FormExerciseCard } from '../FormExerciseCard';

const workoutLocales = DICTIONARY.workout;

describe('FormExerciseCard', () => {
  const mockRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render exercise fields and call remove handler', async () => {
    const user = userEvent.setup();

    renderWithFormik(
      <FormExerciseCard exerciseIndex={0} onRemove={mockRemove} />,
      {
        initialValues: createWorkoutValues(),
      },
    );

    expect(
      screen.getByRole('heading', {
        name: BENCH_PRESS_NAME,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(`1 ${workoutLocales.sets}`)).toBeInTheDocument();
    expect(screen.getByDisplayValue(completedSet.weight)).toBeInTheDocument();
    expect(screen.getByDisplayValue(completedSet.reps)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: workoutLocales.create.removeExercise,
      }),
    );

    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('should add a set using the previous set values', async () => {
    const user = userEvent.setup();

    renderWithFormik(
      <FormExerciseCard exerciseIndex={0} onRemove={mockRemove} />,
      {
        initialValues: createWorkoutValues(),
      },
    );

    await user.click(
      screen.getByRole('button', {
        name: workoutLocales.create.addSet,
      }),
    );

    expect(
      await screen.findByText(`2 ${workoutLocales.sets}`),
    ).toBeInTheDocument();

    expect(screen.getAllByDisplayValue(completedSet.weight)).toHaveLength(2);
    expect(screen.getAllByDisplayValue(completedSet.reps)).toHaveLength(2);
    expect(screen.getAllByText(workoutLocales.weight)).toHaveLength(2);
    expect(screen.getAllByText(workoutLocales.reps)).toHaveLength(2);
    expect(screen.getAllByText(workoutLocales.kg)).toHaveLength(2);
  });

  it('should add a default set when exercise has no sets', async () => {
    const user = userEvent.setup();

    renderWithFormik(
      <FormExerciseCard exerciseIndex={0} onRemove={mockRemove} />,
      {
        initialValues: createWorkoutValues([
          createExercise({
            sets: [],
          }),
        ]),
      },
    );

    await user.click(
      screen.getByRole('button', {
        name: workoutLocales.create.addSet,
      }),
    );

    expect(
      await screen.findByText(`1 ${workoutLocales.sets}`),
    ).toBeInTheDocument();

    expect(screen.getByDisplayValue(0)).toBeInTheDocument();
    expect(screen.getByDisplayValue(1)).toBeInTheDocument();
  });

  it('should remove selected set when more than one set exists', async () => {
    const user = userEvent.setup();

    renderWithFormik(
      <FormExerciseCard exerciseIndex={0} onRemove={mockRemove} />,
      {
        initialValues: createWorkoutValues([
          createExercise({
            sets: [completedSet, extraSet],
          }),
        ]),
      },
    );

    await user.click(
      screen.getByRole('button', {
        name: `${workoutLocales.create.removeSet} ${extraSet.order}`,
      }),
    );

    expect(
      await screen.findByText(`1 ${workoutLocales.sets}`),
    ).toBeInTheDocument();

    expect(screen.queryByDisplayValue(extraSet.weight)).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue(extraSet.reps)).not.toBeInTheDocument();
  });
});
