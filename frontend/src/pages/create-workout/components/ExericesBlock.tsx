import { FieldArray } from 'formik';

import { ExerciseSelect } from '@components';
import type { IExercise } from '@types';
import { DICTIONARY } from '@locales';
import type { IExericesBlockProps } from '../types';
import { ExerciseCard } from './ExerciseCard';

export const ExericesBlock = ({ exercises }: IExericesBlockProps) => {
  const { create } = DICTIONARY.workout;

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <FieldArray name="exercises">
        {({ push, remove }) => (
          <>
            <div>
              {exercises.map((_: IExercise, index: number) => (
                <ExerciseCard
                  key={index}
                  exerciseIndex={index}
                  onRemove={() => remove(index)}
                />
              ))}
            </div>

            <div className="mt-8">
              <p className="text-sm text-zinc-500 mb-3 font-medium uppercase tracking-wider pl-1">
                {create.addExercise}
              </p>

              <ExerciseSelect
                onSelect={(exercise) => {
                  push({
                    exerciseId: exercise.id,
                    name: exercise.name,
                    muscleGroup: exercise.muscleGroup,
                    sets: [{ weight: 0, reps: 0 }],
                  });
                }}
              />
            </div>
          </>
        )}
      </FieldArray>
    </div>
  );
};
