import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

import { DICTIONARY } from '@locales';
import type { IMounthSwitcherProps } from '../types';

export const MonthSwitcher = ({
  prevMonth,
  nextMonth,
  month,
  year,
}: IMounthSwitcherProps) => {
  const { buttons } = DICTIONARY.calendar;
  const arrowButtonStyles =
    'flex h-[clamp(44px,10.5vw,48px)] w-[clamp(44px,10.5vw,48px)] items-center justify-center rounded-[clamp(13px,3.2vw,16px)] border border-border-subtle bg-surface text-xl text-text-subtle transition-[border-color,color,background-color,transform] duration-200 hover:border-accent-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-main active:scale-[0.98]';
  return (
    <div className="flex items-center gap-2 justify-between">
      <button
        aria-label={buttons.previousMonth}
        onClick={prevMonth}
        className={arrowButtonStyles}
      >
        <IoIosArrowBack />
      </button>
      <div className="flex min-h-[clamp(44px,10.5vw,48px)] items-center gap-1 rounded-3xl border border-border-subtle bg-surface px-[clamp(16px,4.5vw,20px)] py-[clamp(6px,1.8vw,8px)] text-[clamp(17px,4.3vw,20px)] font-bold text-white">
        {month}{' '}
        <span className="text-[clamp(12px,3vw,13px)] font-semibold text-text-soft">
          {year}
        </span>
      </div>
      <button
        aria-label={buttons.nextMonth}
        onClick={nextMonth}
        className={arrowButtonStyles}
      >
        <IoIosArrowForward />
      </button>
    </div>
  );
};
