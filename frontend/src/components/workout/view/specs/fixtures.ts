import type { IExercise } from '@types';

export const PUSH_UP_NAME = 'Push Up';
export const BENCH_PRESS_NAME = 'Bench Press';
export const PULL_UP_NAME = 'Pull Up';

export const completedSet = {
  weight: 80,
  reps: 10,
  order: 1,
  isCompleted: true,
};

export const createExercise = (
  overrides: Partial<IExercise> = {},
): IExercise => ({
  id: 'exercise-1',
  exerciseId: 'push-up',
  name: PUSH_UP_NAME,
  sets: [completedSet],
  ...overrides,
});
