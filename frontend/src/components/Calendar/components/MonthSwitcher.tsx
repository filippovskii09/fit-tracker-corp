import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

import type { IMounthSwitcherProps } from '../types';

export const MonthSwitcher = ({
  prevMonth,
  nextMonth,
  month,
  year,
}: IMounthSwitcherProps) => {
  const arrowButtonStyles =
    'flex items-center justify-center w-[clamp(32px,8vw,40px)] h-[clamp(32px,8vw,40px)] rounded-[clamp(10px,2.5vw,14px)] border';
  return (
    <div className="flex items-center gap-2 justify-between">
      <button onClick={prevMonth} className={arrowButtonStyles}>
        <IoIosArrowBack />
      </button>
      <div className="flex items-baseline gap-1 rounded-3xl bg-surface px-[clamp(12px,3.5vw,16px)] py-[clamp(4px,1.4vw,6px)] text-[clamp(14px,3.5vw,18px)] font-bold text-white">
        {month} <span className="text-[clamp(10px,2.4vw,12px)]">{year}</span>
      </div>
      <button onClick={nextMonth} className={arrowButtonStyles}>
        <IoIosArrowForward />
      </button>
    </div>
  );
};
