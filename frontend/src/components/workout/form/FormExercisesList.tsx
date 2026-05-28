import { FieldArray, useFormikContext } from 'formik';
import { useCallback } from 'react';

import { ExerciseSelect } from '@components';
import { DICTIONARY } from '@locales';
import type {
  CreateWorkoutFormValues,
  ExerciseInfoResponse,
  IExercise,
} from '@types';
import { FormExerciseCard } from './FormExerciseCard';

export const FormExercisesList = () => {
  const { values } = useFormikContext<CreateWorkoutFormValues>();
  const { create } = DICTIONARY.workout;

  // remove creating anonim function from return block
  const handleSelect = useCallback(
    (exercise: ExerciseInfoResponse, push: (exercise: IExercise) => void) => {
      push({
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: [{ weight: 0, reps: 1, order: 1, isCompleted: false }],
      });
    },
    [],
  );

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <FieldArray name="exercises">
        {({ push, remove }) => (
          <>
            {/* Exercises list view */}
            <div>
              {values.exercises.map((_: IExercise, index: number) => (
                <FormExerciseCard
                  key={index}
                  exerciseIndex={index}
                  onRemove={() => remove(index)}
                />
              ))}
            </div>

            {/* Adding new exercise from **ExerciseSelect** component */}
            <div className="mt-8">
              <p className="text-sm text-white mb-3 font-medium uppercase tracking-wider pl-1">
                {create.addExercise}
              </p>

              <ExerciseSelect
                onSelect={(exercise) => handleSelect(exercise, push)}
              />
            </div>
          </>
        )}
      </FieldArray>
    </div>
  );
};
