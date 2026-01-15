import { DICTIONARY } from '@locales';
import type { ISubmitButtonBlockProps } from '../types';

export const SubmitButtonBlock = ({
  isSubmitting,
  noOneExercises,
}: ISubmitButtonBlockProps) => {
  const { create } = DICTIONARY.workout;
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-main via-surface to-transparent z-10">
      <button
        type="submit"
        disabled={isSubmitting || noOneExercises}
        className={`
					w-full max-w-md mx-auto font-bold text-lg py-4 rounded-2xl shadow-lg transition-all
					${
            noOneExercises
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-primary text-surface hover:shadow-[0_0_20px_rgba(140,239,13,0.4)] active:scale-[0.98]'
          }
				`}
      >
        {isSubmitting ? create.buttonLoading : create.submitButton}
      </button>
    </div>
  );
};
