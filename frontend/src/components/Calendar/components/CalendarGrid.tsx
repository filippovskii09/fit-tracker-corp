import { WEEK_DAYS } from '../constants';
import type { ICalendarGridProps } from '../types';

export const CalendarGrid = ({
  arrayByDaysInMonth,
  indexOfFirstDayInMonth,
  currentDay,
  checkWorkoutInThisDay,
}: ICalendarGridProps) => {
  return (
    <div className="flex flex-col gap-4 border-b-2 border-white pb-7">
      <div className="grid grid-cols-7 gap-y-8 space-b gap-2.5">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="flex justify-center font-medium text-xs text-[#9C9D9F]"
          >
            {day.slice(0, 3)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-8 gap-x-2.5">
        {arrayByDaysInMonth?.map((day) => {
          const currentDayStyle =
            currentDay === day ? 'bg-[#8CEF0D] text-[#0C110F] font-bold' : '';
          const hasWorkout = checkWorkoutInThisDay(day);
          return (
            <div
              key={day}
              className={`h-10 w-10 flex relative items-center justify-center font-medium text-xs rounded-xl ${currentDayStyle}`}
              style={
                day === 1
                  ? { gridColumnStart: `${indexOfFirstDayInMonth}` }
                  : {}
              }
            >
              {day}
              {hasWorkout ? (
                <span
                  className={`w-2 h-2 ${currentDayStyle ? 'bg-[#0C110F]' : 'bg-[#8CEF0D]'} rounded-full absolute left-1/2 -translate-x-1/2 bottom-0.5`}
                ></span>
              ) : (
                ''
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
