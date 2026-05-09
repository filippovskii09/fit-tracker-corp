import type {
  CreateWorkoutFormValues,
  ExerciseInfoResponse,
  IExercise,
} from '@types';

export const BENCH_PRESS_NAME = 'Bench Press';
export const PUSH_UP_NAME = 'Push Up';
export const PULL_UP_NAME = 'Pull Up';
export const SELECT_EXERCISE_BUTTON = 'Select exercise';

export const selectedExercise: ExerciseInfoResponse = {
  id: 'pull-up',
  name: PULL_UP_NAME,
  muscleGroup: 'Back' as ExerciseInfoResponse['muscleGroup'],
};

export const completedSet = {
  weight: 80,
  reps: 10,
  order: 1,
  isCompleted: true,
};

export const extraSet = {
  weight: 85,
  reps: 8,
  order: 2,
  isCompleted: true,
};

export const createExercise = (
  overrides: Partial<IExercise> = {},
): IExercise => ({
  id: 'exercise-1',
  exerciseId: 'bench-press',
  name: BENCH_PRESS_NAME,
  sets: [completedSet],
  ...overrides,
});

export const createWorkoutValues = (
  exercises: IExercise[] = [createExercise()],
): CreateWorkoutFormValues => ({
  name: 'Workout',
  date: '2026-05-01',
  exercises,
});
