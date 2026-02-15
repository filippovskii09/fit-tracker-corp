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
    <div className="flex flex-col gap-[clamp(12px,3vw,18px)] border-b-2 border-white pb-[clamp(16px,4vw,28px)]">
      <div className="grid grid-cols-7 gap-x-[clamp(8px,2.2vw,12px)] gap-y-[clamp(16px,4.2vw,28px)]">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="flex justify-center text-[clamp(11px,2.6vw,12px)] font-medium text-muted"
          >
            {day.slice(0, 3)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-x-[clamp(8px,2.2vw,12px)] gap-y-[clamp(16px,4.2vw,28px)] contain-layout">
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
