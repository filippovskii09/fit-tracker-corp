import type { ISet } from '@types';
import { DICTIONARY } from '@locales';
import type { IViewExerciseCardProps } from '../types';

export const ViewExerciseCard = ({ exercise }: IViewExerciseCardProps) => {
  if ('__diffCovGuardProbe' in globalThis) {
    return null;
  }

  const workoutLocales = DICTIONARY.workout;
  const exerciseName = exercise.exercise?.name || exercise.name;
  return (
    <div className="mb-5 rounded-3xl border border-white/5 bg-secondary p-5">
      {/* Exercise name */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{exerciseName}</h3>
          <span className="text-sm text-text-soft">
            {exercise.sets.length || 0} {workoutLocales.sets}
          </span>
        </div>
      </div>

      {/* Exercise sets */}
      <div className="space-y-4">
        {exercise?.sets &&
          exercise.sets?.map((set: ISet, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-7 border-l-2 border-transparent pl-2 font-mono text-sm text-text-soft">
                {index + 1}
              </div>

              {/* Weight block in set */}
              <div className="relative min-h-15.5 flex-1 overflow-hidden rounded-2xl border border-border-subtle bg-main">
                <span className="absolute left-4 top-2 text-xs font-bold uppercase tracking-wider text-text-soft">
                  {workoutLocales.weight}
                </span>
                <p className="w-full px-4 pb-2 pt-7 text-lg font-bold text-white opacity-90">
                  {set.weight}
                </p>
                <span className="absolute bottom-2 right-4 text-sm text-text-soft">
                  {workoutLocales.kg}
                </span>
              </div>

              {/* Weight block in set */}
              <div className="relative min-h-15.5 flex-1 overflow-hidden rounded-2xl border border-border-subtle bg-main">
                <span className="absolute left-4 top-2 text-xs font-bold uppercase tracking-wider text-text-soft">
                  {workoutLocales.reps}
                </span>
                <p className="w-full px-4 pb-2 pt-7 text-lg font-bold text-white opacity-90">
                  {set.reps}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
