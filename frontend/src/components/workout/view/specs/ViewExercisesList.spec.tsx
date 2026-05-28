import { render, screen } from '@testUtils';
import type { IExercise } from '@types';
import { BENCH_PRESS_NAME, PULL_UP_NAME, createExercise } from './fixtures';
import { ViewExercisesList } from '../ViewExercisesList';

describe('ViewExercisesList', () => {
  it('should render every exercise card when exercises exist', () => {
    const exercises = [
      createExercise({
        exerciseId: 'bench-press',
        name: BENCH_PRESS_NAME,
      }),
      createExercise({
        id: 'exercise-2',
        exerciseId: 'pull-up',
        name: PULL_UP_NAME,
      }),
    ];

    render(<ViewExercisesList exercises={exercises} />, {});

    const renderedExercises = screen.getAllByRole('heading');

    expect(renderedExercises).toHaveLength(exercises.length * 2);
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
  });

  it('should render nothing when exercises are empty', () => {
    render(<ViewExercisesList exercises={[]} />, {});

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render nothing when exercises are missing', () => {
    render(
      <ViewExercisesList exercises={undefined as unknown as IExercise[]} />,
      {},
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
