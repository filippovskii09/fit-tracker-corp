import { CalendarActions, CalendarGrid, MonthSwitcher } from './components';
import { useCalendar } from './hooks';
import type { ICalendarProps } from './types';

export const Calendar = ({
  workouts,
  openModalByClickOnDayCell,
  onSelectDate,
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
    monthIndex,
  } = useCalendar(workouts);

  return (
    <div className="flex w-full max-w-112 flex-col gap-[clamp(36px,9vw,44px)] p-[clamp(12px,4vw,28px)]">
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
        onSelectDate={onSelectDate}
        year={year}
        monthIndex={monthIndex}
      />
      <CalendarActions backToday={backToday} />
    </div>
  );
};
