import { WEEK_DAYS } from '../constants';
import type { ICalendarGridProps } from '../types';
import { CalendarDayCell } from './CalendarDayCell';

export const CalendarGrid = ({
  arrayByDaysInMonth,
  indexOfFirstDayInMonth,
  currentDay,
  checkWorkoutInThisDay,
  openModalByClickOnDayCell,
  getWorkoutByDay,
}: ICalendarGridProps) => {
  return (
    <div className="flex flex-col gap-4 border-b-2 border-white pb-7">
      <div className="grid grid-cols-7 gap-y-8 space-b gap-2.5">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="flex justify-center font-medium text-xs text-muted"
          >
            {day.slice(0, 3)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-8 gap-x-2.5">
        {arrayByDaysInMonth?.map((day) => (
          <CalendarDayCell
            key={day}
            day={day}
            isCurrent={currentDay === day}
            initialWorkoutId={getWorkoutByDay(day)?.id || ''}
            hasWorkout={checkWorkoutInThisDay(day)}
            colStart={indexOfFirstDayInMonth}
            isFirstDay={day === 1}
            openModalByClickOnDayCell={openModalByClickOnDayCell}
          />
        ))}
      </div>
    </div>
  );
};
