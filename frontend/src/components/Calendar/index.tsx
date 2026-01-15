import { CalendarActions, CalendarGrid, MonthSwitcher } from './components';
import { useCalendar } from './hooks';
import type { ICalendarProps } from './types';

export const Calendar = ({
  workouts,
  openModalByClickOnDayCell,
}: ICalendarProps) => {
  const {
    month,
    year,
    prevMonth,
    nextMonth,
    arrayByDaysInMonth,
    indexOfFirstDayInMonth,
    currentDay,
    backToday,
    checkWorkoutInThisDay,
    getWorkoutByDay,
  } = useCalendar(workouts);

  return (
    <div className="flex flex-col gap-20 w-[384px] p-6">
      <MonthSwitcher
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        month={month}
        year={year}
      />
      <CalendarGrid
        arrayByDaysInMonth={arrayByDaysInMonth}
        indexOfFirstDayInMonth={indexOfFirstDayInMonth}
        currentDay={currentDay}
        checkWorkoutInThisDay={checkWorkoutInThisDay}
        getWorkoutByDay={getWorkoutByDay}
        openModalByClickOnDayCell={openModalByClickOnDayCell}
      />
      <CalendarActions backToday={backToday} />
    </div>
  );
};
