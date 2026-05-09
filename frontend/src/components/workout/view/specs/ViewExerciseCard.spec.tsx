import { DICTIONARY } from '@locales';
import { render, screen } from '@testUtils';
import type { IExercise } from '@types';
import {
  BENCH_PRESS_NAME,
  PUSH_UP_NAME,
  completedSet,
  createExercise,
} from './fixtures';
import { ViewExerciseCard } from '../ViewExerciseCard';

const workoutLocales = DICTIONARY.workout;

describe('ViewExerciseCard', () => {
  it('should render exercise info from nested exercise details', () => {
    const exercise = createExercise({
      exercise: {
        id: 'bench-press',
        name: BENCH_PRESS_NAME,
        muscleGroup: 'Chest',
      } as IExercise['exercise'],
      sets: [
        completedSet,
        {
          weight: 85,
          reps: 8,
          order: 2,
          isCompleted: true,
        },
      ],
    });

    render(<ViewExerciseCard exercise={exercise} />, {});

    expect(
      screen.getByRole('heading', {
        name: BENCH_PRESS_NAME,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(`2 ${workoutLocales.sets}`)).toBeInTheDocument();
    expect(screen.getByText(completedSet.weight)).toBeInTheDocument();
    expect(screen.getByText(completedSet.reps)).toBeInTheDocument();
    expect(screen.getAllByText(workoutLocales.weight)).toHaveLength(2);
    expect(screen.getAllByText(workoutLocales.reps)).toHaveLength(2);
    expect(screen.getAllByText(workoutLocales.kg)).toHaveLength(2);
  });

  it('should fall back to exercise name when nested details are absent', () => {
    render(<ViewExerciseCard exercise={createExercise()} />, {});

    expect(
      screen.getByRole('heading', {
        name: PUSH_UP_NAME,
      }),
    ).toBeInTheDocument();
  });

  it('should render zero sets when exercise has no sets', () => {
    render(<ViewExerciseCard exercise={createExercise({ sets: [] })} />, {});

    expect(screen.getByText(`0 ${workoutLocales.sets}`)).toBeInTheDocument();
    expect(screen.queryByText(workoutLocales.weight)).not.toBeInTheDocument();
    expect(screen.queryByText(workoutLocales.reps)).not.toBeInTheDocument();
    expect(screen.queryByText(workoutLocales.kg)).not.toBeInTheDocument();
  });
});
