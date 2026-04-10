import { useNavigate } from 'react-router-dom';
import { memo } from 'react';

import type {
  ICalendarDayCellPointProps,
  ICalendarDayCellProps,
} from '../types';
import { APP_ROUTES } from '@constants';

const colStartClasses: Record<number, string> = {
  1: 'col-start-1',
  2: 'col-start-2',
  3: 'col-start-3',
  4: 'col-start-4',
  5: 'col-start-5',
  6: 'col-start-6',
  7: 'col-start-7',
};

const CalendarDayCellPoint = ({ pointClasses }: ICalendarDayCellPointProps) => (
  <span
    className={`absolute bottom-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full ${pointClasses}`}
  ></span>
);

export const CalendarDayCell = memo(
  ({
    day,
    year,
    monthIndex,
    isCurrent,
    hasWorkout,
    colStart,
    isFirstDay,
    openModalByClickOnDayCell,
    initialWorkoutId,
    onSelectDate,
  }: ICalendarDayCellProps) => {
    const navigate = useNavigate();
    const baseClasses =
      'relative flex h-[clamp(42px,12vw,50px)] w-full max-w-12.5 justify-self-center items-center justify-center rounded-[clamp(13px,3.2vw,16px)] border border-transparent text-[clamp(15px,3.8vw,17px)] font-semibold text-white transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:border-border-subtle hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-main active:scale-[0.98]';
    const activeClasses = isCurrent
      ? 'border-accent-border bg-accent-soft text-primary'
      : '';
    const pointClasses = isCurrent ? 'bg-primary' : 'bg-accent-border';
    const gridStyle = isFirstDay ? colStartClasses[colStart] : '';

    const handleClick = () => {
      if (hasWorkout) {
        navigate(`${APP_ROUTES.WORKOUTS.ROOT}/${initialWorkoutId}`);
      } else {
        onSelectDate({ year, monthIndex, day });
        openModalByClickOnDayCell();
      }
    };

    return (
      <button
        key={day}
        className={`${baseClasses} ${activeClasses} ${gridStyle}`}
        onClick={handleClick}
        aria-pressed={isCurrent}
      >
        {day}

        {hasWorkout && <CalendarDayCellPoint pointClasses={pointClasses} />}
      </button>
    );
  },
);
