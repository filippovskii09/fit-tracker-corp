import type { ISet } from '@types';
import { DICTIONARY } from '@locales';
import type { IViewExerciseCardProps } from '../types';

export const ViewExerciseCard = ({ exercise }: IViewExerciseCardProps) => {
  const workoutLocales = DICTIONARY.workout;
  const exerciseName = exercise.exercise?.name || exercise.name;
  return (
    <div className="bg-secondary p-4 rounded-2xl mb-4 border border-white/5">
      {/* Exercise name */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white text-lg font-bold">{exerciseName}</h3>
          <span className="text-xs text-zinc-500">
            {exercise.sets.length || 0} {workoutLocales.sets}
          </span>
        </div>
      </div>

      {/* Exercise sets */}
      <div className="space-y-3">
        {exercise?.sets &&
          exercise.sets?.map((set: ISet, index: number) => (
            <div key={index} className="flex gap-3 items-center">
              <div className="w-6 text-zinc-500 text-xs font-mono border-l-2 border-transparent pl-2">
                {index + 1}
              </div>

              {/* Weight block in set */}
              <div className="flex-1 relative bg-black/20 rounded-xl overflow-hidden border border-zinc-800">
                <span className="absolute top-2 left-3 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  {workoutLocales.weight}
                </span>
                <p className="w-full text-white font-bold pt-6 pb-2 px-3 opacity-90">
                  {set.weight}
                </p>
                <span className="absolute right-3 bottom-2 text-zinc-500 text-xs">
                  {workoutLocales.kg}
                </span>
              </div>

              {/* Weight block in set */}
              <div className="flex-1 relative bg-black/20 rounded-xl overflow-hidden border border-zinc-800">
                <span className="absolute top-2 left-3 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  {workoutLocales.reps}
                </span>
                <p className="w-full text-white font-bold pt-6 pb-2 px-3 opacity-90">
                  {set.reps}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
