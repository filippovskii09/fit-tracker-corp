import { useCallback, useMemo, useState } from 'react';

import type { WorkoutPreview } from '@types';
import { MONTH_NAMES } from './constants';

export const useCalendar = (workouts: WorkoutPreview[]) => {
  const now = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(now);

  const year = viewDate.getFullYear();
  const currentMonthIndex = viewDate.getMonth();
  const month = MONTH_NAMES[currentMonthIndex];

  const prevMonth = () => {
    setViewDate(
      (prevMonth) =>
        new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setViewDate(
      (prevMonth) =>
        new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1),
    );
  };

  const daysInMonth = useMemo(
    () => new Date(year, currentMonthIndex + 1, 0).getDate(),
    [year, currentMonthIndex],
  );

  const arrayByDaysInMonth = useMemo(
    () => Array.from({ length: daysInMonth }, (_, index) => index + 1),
    [daysInMonth],
  );

  const indexOfFirstDayInMonth = useMemo(
    () => new Date(year, currentMonthIndex, 1).getDay() + 1,
    [year, currentMonthIndex],
  );

  const backToday = () => {
    setViewDate(now);
  };

  const currentDay = useMemo(
    () =>
      now.getFullYear() === year && now.getMonth() === currentMonthIndex
        ? now.getDate()
        : NaN,
    [year, currentMonthIndex, now],
  );

  const workoutsMap = useMemo(() => {
    const map = new Map();
    workouts.forEach((workout) => {
      const day = new Date(workout.date);
      if (day.getFullYear() === year && day.getMonth() === currentMonthIndex) {
        map.set(day.getDate(), workout);
      }
    });
    return map;
  }, [workouts, year, currentMonthIndex]);

  const checkWorkoutInThisDay = useCallback(
    (day: number) => {
      return workoutsMap.has(day);
    },
    [workoutsMap],
  );

  const getWorkoutByDay = useCallback(
    (day: number) => workoutsMap.get(day),
    [workoutsMap],
  );

  return {
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
    monthIndex: currentMonthIndex,
  };
};
