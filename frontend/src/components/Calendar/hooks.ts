import { useCallback, useMemo, useState } from 'react';

import type { WorkoutPreview } from '@types';
import { MONTH_NAMES } from './constants';

export const useCalendar = (workouts: WorkoutPreview[]) => {
  const now = new Date();
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

  const daysInMonth = new Date(year, currentMonthIndex + 1, 0).getDate();

  const arrayByDaysInMonth = Array.from(
    { length: daysInMonth },
    (_, index) => index + 1,
  );

  const indexOfFirstDayInMonth =
    new Date(year, currentMonthIndex, 1).getDay() + 1;

  const backToday = () => {
    setViewDate(now);
  };

  const currentDay =
    now.getFullYear() === year && now.getMonth() === currentMonthIndex
      ? now.getDate()
      : NaN;

  const workoutsMap = useMemo(() => {
    const map = new Map();
    workouts.forEach((workout) => {
      const day = new Date(workout.date).getDate();
      map.set(day, workout);
    });
    return map;
  }, [workouts]);

  const checkWorkoutInThisDay = (day: number) => {
    return workouts.some((workout) => {
      const workoutDate = new Date(workout.date);
      return (
        workoutDate.getFullYear() === year &&
        workoutDate.getMonth() === currentMonthIndex &&
        workoutDate.getDate() === day
      );
    });
  };

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
  };
};
