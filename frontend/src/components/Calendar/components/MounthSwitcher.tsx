import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

import type { IMounthSwitcherProps } from '../types';

export const MounthSwitcher = ({
  prevMonth,
  nextMonth,
  month,
  year,
}: IMounthSwitcherProps) => {
  return (
    <div className="flex items-center gap-2 justify-between">
      <button
        onClick={prevMonth}
        className="flex items-center justify-center w-8 h-8 rounded-lg border"
      >
        <IoIosArrowBack />
      </button>
      <div className="font-bold text-white px-4 py-1 rounded-3xl bg-slate-700 text-lg flex items-baseline gap-1">
        {month} <span className="text-[10px]">{year}</span>
      </div>
      <button
        onClick={nextMonth}
        className="flex items-center justify-center w-8 h-8 rounded-lg border"
      >
        <IoIosArrowForward />
      </button>
    </div>
  );
};
