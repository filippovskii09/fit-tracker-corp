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
    <div className="sticky top-0 z-20 bg-main/80 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-white hover:text-primary transition-colors"
      >
        <IoMdArrowBack size={24} />
      </button>
      <div className="flex-1">
        <input
          name="name"
          value={name}
          onChange={handleChange}
          placeholder={create.titlePlaceholder}
          readOnly={readOnly}
          className="bg-transparent text-xl font-bold w-full focus:outline-none placeholder-zinc-600"
          autoComplete="off"
        />

        <div className="text-xs text-primary font-mono mt-0.5">
          {new Date(date).toDateString()}
        </div>
        {nameError ? (
          <div className="mt-1 text-xs text-red-400">{nameError}</div>
        ) : null}
      </div>
    </div>
  );
};
