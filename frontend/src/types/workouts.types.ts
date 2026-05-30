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

export interface IWorkout {
  id: string;
  name: string;
  date: string;
  userId: string;
  status: string;
  exercises: IExercise[];
}

export interface CreateWorkoutFormValues {
  name: string;
  date: string;
  exercises: IExercise[];
}

export interface RemoveWorkoutResponse {
  deleted: boolean;
}
