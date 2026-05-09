import { IoMdArrowBack } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';

import { DICTIONARY } from '@locales';
import type { IStickyHeaderProps } from '../types';

export const StickyHeader = ({
  name,
  date,
  handleChange,
  readOnly = false,
  nameError,
}: IStickyHeaderProps) => {
  const navigate = useNavigate();
  const { create } = DICTIONARY.workout;

  return (
    <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/5 bg-main/80 px-5 py-5 backdrop-blur-md">
      <button
        type="button"
        aria-label={create.goBack}
        onClick={() => navigate(-1)}
        className="flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-main"
      >
        <IoMdArrowBack size={26} />
      </button>
      <div className="flex-1">
        <input
          name="name"
          value={name}
          onChange={handleChange}
          placeholder={create.titlePlaceholder}
          readOnly={readOnly}
          className="w-full bg-transparent text-workout-title font-bold leading-tight placeholder-zinc-600 focus:outline-none"
          autoComplete="off"
        />

        <div className="mt-1 text-sm font-mono text-primary">
          {new Date(date).toDateString()}
        </div>
        {nameError ? (
          <div className="mt-1 text-sm text-red-400">{nameError}</div>
        ) : null}
      </div>
    </div>
  );
};
