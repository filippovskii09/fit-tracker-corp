import type { ChangeEvent, ReactNode } from 'react';

import type { IExercise } from '@types';

export interface IExerciseCardProps {
  exerciseIndex: number;
  onRemove?: () => void;
}

export interface IViewExerciseCardProps {
  exercise: IExercise;
}

export interface IStickyHeaderProps {
  name: string;
  date: string;
  handleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  nameError?: string;
  actions?: ReactNode;
}

export interface IExericesBlockProps {
  exercises: IExercise[];
  isView?: boolean;
}

export interface ISubmitButtonBlockProps {
  isSubmitting: boolean;
  isValid: boolean;
}

export interface IViewExercisesListProps {
  exercises: IExercise[];
}

export interface IFormExerciseCardProps {
  exerciseIndex: number;
  onRemove: () => void;
}
