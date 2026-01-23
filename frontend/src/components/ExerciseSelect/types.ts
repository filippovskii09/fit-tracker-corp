import type { ExerciseInfoResponse } from '@types';

export interface IExerciseSelectProps {
  onSelect: (exercise: ExerciseInfoResponse) => void;
  disabled?: boolean;
}
