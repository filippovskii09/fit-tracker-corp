import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { useGetWorkouts } from './queries';

export const useDashboardPage = () => {
  const navigate = useNavigate();
  const { WORKOUT_CREATE } = DICTIONARY.modals;
  const { data } = useGetWorkouts();
  const [isCreateWorkoutModalOpen, setIsCreateWorkoutModalOpen] =
    useState<boolean>(false);

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
    navigate(APP_ROUTES.WORKOUTS.CREATE);
    closeCreateWorkoutModalOpenModal();
  }, [closeCreateWorkoutModalOpenModal, navigate]);

  return {
    isCreateWorkoutModalOpen,
    closeCreateWorkoutModalOpenModal,
    confirmWorkoutCreating,
    openModalByClickOnDayCell,
    data,
    WORKOUT_CREATE,
  };
};
