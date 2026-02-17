import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { toISODate } from '@utils';
import type { SelectDate } from '@types';
import { useGetWorkouts } from './queries';

export const useDashboardPage = () => {
  const navigate = useNavigate();
  const { WORKOUT_CREATE } = DICTIONARY.modals;
  const { data } = useGetWorkouts();
  const [isCreateWorkoutModalOpen, setIsCreateWorkoutModalOpen] =
    useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const openCreateWorkoutModalOpenModal = useCallback(
    () => setIsCreateWorkoutModalOpen(true),
    [],
  );
  const closeCreateWorkoutModalOpenModal = useCallback(
    () => setIsCreateWorkoutModalOpen(false),
    [],
  );

  const openModalByClickOnDayCell = useCallback(() => {
    openCreateWorkoutModalOpenModal();
  }, [openCreateWorkoutModalOpenModal]);

  const confirmWorkoutCreating = useCallback(() => {
    navigate(`${APP_ROUTES.WORKOUTS.CREATE}?date=${selectedDate}`);
    closeCreateWorkoutModalOpenModal();
  }, [closeCreateWorkoutModalOpenModal, navigate, selectedDate]);

  const onSelectDate = useCallback(({ year, monthIndex, day }: SelectDate) => {
    const formatedSelectedDate = toISODate(year, monthIndex, day);
    setSelectedDate(formatedSelectedDate);
  }, []);

  return {
    isCreateWorkoutModalOpen,
    closeCreateWorkoutModalOpenModal,
    confirmWorkoutCreating,
    openModalByClickOnDayCell,
    data,
    WORKOUT_CREATE,
    onSelectDate,
  };
};
