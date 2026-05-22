import { DICTIONARY } from '@locales';
import type { ISubmitButtonBlockProps } from '../types';

export const SubmitButtonBlock = ({
  isSubmitting,
  isValid,
}: ISubmitButtonBlockProps) => {
  const { create } = DICTIONARY.workout;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-linear-to-t from-main via-surface to-transparent p-5 contain-layout">
      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className={`
					mx-auto min-h-control-lg w-full max-w-md rounded-3xl py-4 text-lg font-bold shadow-lg transition-all
					${
            !isValid
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-primary text-surface hover:shadow-primary-glow active:scale-[0.98]'
          }
				`}
      >
        {isSubmitting ? create.buttonLoading : create.submitButton}
      </button>
    </div>
  );
};
