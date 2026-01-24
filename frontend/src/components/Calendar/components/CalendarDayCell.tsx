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
    className={`w-2 h-2 ${pointClasses} rounded-full absolute left-1/2 -translate-x-1/2 bottom-0.5`}
  ></span>
);

export const CalendarDayCell = memo(
  ({
    day,
    isCurrent,
    hasWorkout,
    colStart,
    isFirstDay,
    openModalByClickOnDayCell,
    initialWorkoutId,
  }: ICalendarDayCellProps) => {
    const navigate = useNavigate();
    const baseClasses =
      'h-10 w-10 flex relative items-center justify-center font-medium text-xs rounded-xl transition-colors';
    const activeClasses = isCurrent ? 'bg-primary text-main font-bold' : '';
    const pointClasses = isCurrent ? 'bg-main' : 'bg-primary';
    const gridStyle = isFirstDay ? colStartClasses[colStart] : '';
    const handleClick = () => {
      if (hasWorkout) {
        navigate(`${APP_ROUTES.WORKOUTS.ROOT}/${initialWorkoutId}`);
      } else {
        openModalByClickOnDayCell();
      }
    };

    return (
      <button
        key={day}
        className={`${baseClasses} ${activeClasses} ${gridStyle}`}
        onClick={handleClick}
      >
        {day}

        {hasWorkout && <CalendarDayCellPoint pointClasses={pointClasses} />}
      </button>
    );
  },
);
