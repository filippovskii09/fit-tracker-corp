import type { ChangeEvent } from 'react';

import type { IExercise } from '@types';

export interface IExerciseCardProps {
  exerciseIndex: number;
  onRemove: () => void;
}

export interface IStickyHeaderProps {
  name: string;
  date: string;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export interface IExericesBlockProps {
  exercises: IExercise[];
}

export interface ISubmitButtonBlockProps {
  isSubmitting: boolean;
  noOneExercises: boolean;
}

export interface CreateWorkoutFormValues {
  name: string;
  date: string;
  exercises: IExercise[];
}
