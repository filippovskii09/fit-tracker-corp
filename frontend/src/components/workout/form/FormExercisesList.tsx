import { FieldArray, useFormikContext } from 'formik';

import { ExerciseSelect } from '@components';
import { DICTIONARY } from '@locales';
import type { CreateWorkoutFormValues, IExercise } from '@types';
import { FormExerciseCard } from './FormExerciseCard';

export const FormExercisesList = () => {
  const { values } = useFormikContext<CreateWorkoutFormValues>();
  const { create } = DICTIONARY.workout;

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
