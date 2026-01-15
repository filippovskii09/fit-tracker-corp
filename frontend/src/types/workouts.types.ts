import type { IExercise } from './exercises.types';

export interface CreateWorkoutDto {
  name: string;
  date: string;
  exercises: IExercise[];
}

export interface WorkoutPreview {
  id: string;
  name: string;
  date: string;
  status: string;
}
