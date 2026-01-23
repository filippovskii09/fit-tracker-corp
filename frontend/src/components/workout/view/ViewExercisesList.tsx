import { ViewExerciseCard } from './ViewExerciseCard';
import type { IViewExercisesListProps } from '../types';
import type { IExercise } from '@types';

export const ViewExercisesList = ({ exercises }: IViewExercisesListProps) => {
  if (!exercises?.length) return null;

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      {exercises.map((exercise: IExercise) => (
        <ViewExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
};
