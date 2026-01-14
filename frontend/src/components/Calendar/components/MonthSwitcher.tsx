import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

import type { IMounthSwitcherProps } from '../types';

export const MonthSwitcher = ({
  prevMonth,
  nextMonth,
  month,
  year,
}: IMounthSwitcherProps) => {
  const arrowButtonStyles =
    'flex items-center justify-center w-8 h-8 rounded-lg border';
  return (
    <div className="flex items-center gap-2 justify-between">
      <button onClick={prevMonth} className={arrowButtonStyles}>
        <IoIosArrowBack />
      </button>
      <div className="font-bold text-white px-4 py-1 rounded-3xl bg-surface text-lg flex items-baseline gap-1">
        {month} <span className="text-[10px]">{year}</span>
      </div>
      <button onClick={nextMonth} className={arrowButtonStyles}>
        <IoIosArrowForward />
      </button>
    </div>
  );
};
