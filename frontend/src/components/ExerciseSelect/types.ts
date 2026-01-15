import type { ExercisesResponse } from '@types';

export interface IExerciseSelectProps {
  onSelect: (exercise: ExercisesResponse) => void;
  disabled?: boolean;
}
