import { FieldArray, useFormikContext } from 'formik';
import { IconButton } from '@mui/material';
import { IoMdClose, IoMdAdd } from 'react-icons/io';

import type { CreateWorkoutFormValues, ISet } from '@types';
import { DICTIONARY } from '@locales';
import type { IFormExerciseCardProps } from '../types';

export const FormExerciseCard = ({
  exerciseIndex,
  onRemove,
}: IFormExerciseCardProps) => {
  const { values, handleChange, handleBlur } =
    useFormikContext<CreateWorkoutFormValues>();

  const exercise = values.exercises[exerciseIndex];
  const sets = exercise.sets;
  const workoutLocales = DICTIONARY.workout;

  return (
    <div className="mb-5 rounded-3xl border border-white/5 bg-secondary p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{exercise.name}</h3>
          <span className="text-sm text-text-soft">
            {sets?.length} {workoutLocales.sets}
          </span>
        </div>
        <IconButton
          aria-label={workoutLocales.create.removeExercise}
          onClick={onRemove}
          size="medium"
          sx={{ color: 'text.secondary' }}
        >
          <IoMdClose />
        </IconButton>
      </div>

      <FieldArray name={`exercises.${exerciseIndex}.sets`}>
        {({ push, remove }) => (
          <div>
            <div className="space-y-4">
              {sets.map((set: ISet, setIndex: number) => {
                const weightName = `exercises.${exerciseIndex}.sets.${setIndex}.weight`;
                const repsName = `exercises.${exerciseIndex}.sets.${setIndex}.reps`;

                return (
                  <div key={setIndex} className="group flex items-center gap-3">
                    <div className="w-7 border-l-2 border-transparent pl-2 font-mono text-sm text-text-soft transition-colors group-hover:border-primary">
                      {setIndex + 1}
                    </div>

                    {/* Weight Input */}
                    <div className="relative min-h-15.5 flex-1 overflow-hidden rounded-2xl border border-border-subtle bg-main transition-colors focus-within:border-primary">
                      <label className="absolute left-4 top-2 text-xs font-bold uppercase tracking-wider text-text-soft">
                        {workoutLocales.weight}
                      </label>
                      <input
                        name={weightName}
                        value={set.weight}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        type="number"
                        placeholder="0"
                        className="w-full bg-transparent px-4 pb-2 pt-7 text-lg font-bold text-white outline-none"
                      />
                      <span className="absolute bottom-2 right-4 text-sm text-text-soft">
                        {workoutLocales.kg}
                      </span>
                    </div>

                    {/* Reps Input */}
                    <div className="relative min-h-15.5 flex-1 overflow-hidden rounded-2xl border border-border-subtle bg-main transition-colors focus-within:border-primary">
                      <label className="absolute left-4 top-2 text-xs font-bold uppercase tracking-wider text-text-soft">
                        {workoutLocales.reps}
                      </label>
                      <input
                        name={repsName}
                        value={set.reps}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        type="number"
                        placeholder="0"
                        className="w-full bg-transparent px-4 pb-2 pt-7 text-lg font-bold text-white outline-none"
                      />
                    </div>

                    {/* Delete Set */}
                    {sets.length > 1 && (
                      <button
                        type="button"
                        aria-label={`${workoutLocales.create.removeSet} ${setIndex + 1}`}
                        onClick={() => remove(setIndex)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl p-2 text-disabled transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-main"
                      >
                        <IoMdClose size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Set Button */}
            <button
              type="button"
              onClick={() => {
                const lastSet = sets[sets.length - 1];
                push({
                  weight: lastSet ? lastSet.weight : 0,
                  reps: lastSet ? lastSet.reps : 1,
                  isCompleted: false,
                });
              }}
              className="mt-5 flex min-h-11 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-soft transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-main"
            >
              <IoMdAdd size={18} /> {workoutLocales.create.addSet}
            </button>
          </div>
        )}
      </FieldArray>
    </div>
  );
};
