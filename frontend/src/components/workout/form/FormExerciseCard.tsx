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
    <div className="bg-secondary p-4 rounded-2xl mb-4 border border-white/5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white text-lg font-bold">{exercise.name}</h3>
          <span className="text-xs text-zinc-500">
            {sets?.length} {workoutLocales.sets}
          </span>
        </div>
        <IconButton onClick={onRemove} size="small" sx={{ color: '#666' }}>
          <IoMdClose />
        </IconButton>
      </div>

      <FieldArray name={`exercises.${exerciseIndex}.sets`}>
        {({ push, remove }) => (
          <div>
            <div className="space-y-3">
              {sets.map((set: ISet, setIndex: number) => {
                const weightName = `exercises.${exerciseIndex}.sets.${setIndex}.weight`;
                const repsName = `exercises.${exerciseIndex}.sets.${setIndex}.reps`;

                return (
                  <div key={setIndex} className="flex gap-3 items-center group">
                    <div className="w-6 text-zinc-500 text-xs font-mono border-l-2 border-transparent group-hover:border-primary pl-2 transition-colors">
                      {setIndex + 1}
                    </div>

                    {/* Weight Input */}
                    <div className="flex-1 relative bg-black/40 rounded-xl overflow-hidden border border-zinc-700 focus-within:border-primary transition-colors">
                      <label className="absolute top-2 left-3 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        {workoutLocales.weight}
                      </label>
                      <input
                        name={weightName}
                        value={set.weight}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        type="number"
                        placeholder="0"
                        className="w-full bg-transparent text-white font-bold pt-6 pb-2 px-3 outline-none"
                      />
                      <span className="absolute right-3 bottom-2 text-zinc-500 text-xs">
                        {workoutLocales.kg}
                      </span>
                    </div>

                    {/* Reps Input */}
                    <div className="flex-1 relative bg-black/40 rounded-xl overflow-hidden border border-zinc-700 focus-within:border-primary transition-colors">
                      <label className="absolute top-2 left-3 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        {workoutLocales.reps}
                      </label>
                      <input
                        name={repsName}
                        value={set.reps}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        type="number"
                        placeholder="0"
                        className="w-full bg-transparent text-white font-bold pt-6 pb-2 px-3 outline-none"
                      />
                    </div>

                    {/* Delete Set */}
                    {sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(setIndex)}
                        className="text-zinc-700 hover:text-red-500 transition-colors p-2"
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
                  reps: lastSet ? lastSet.reps : 0,
                  isCompleted: false,
                });
              }}
              className="mt-4 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-primary transition-colors uppercase tracking-wide px-2 py-2"
            >
              <IoMdAdd size={16} /> {workoutLocales.create.addSet}
            </button>
          </div>
        )}
      </FieldArray>
    </div>
  );
};
