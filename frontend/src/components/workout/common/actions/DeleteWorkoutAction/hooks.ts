import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useRemoveWorkout } from './queries';

export const useDeleteWorkoutAction = () => {
  const { id } = useParams();

  const [isDeleteWorkoutModalOpen, setIsDeleteWorkoutModalOpen] =
    useState<boolean>(false);

  const { mutateAsync: removeWorkout, isPending: isRemovingWorkout } =
    useRemoveWorkout(id!);

  const openDeleteWorkoutModal = () => {
    setIsDeleteWorkoutModalOpen(true);
  };

  const closeDeleteWorkoutModal = () => {
    setIsDeleteWorkoutModalOpen(false);
  };

  const confirmWorkoutDeleting = async () => {
    closeDeleteWorkoutModal();
    await removeWorkout();
  };

  return {
    isDeleteWorkoutModalOpen,
    openDeleteWorkoutModal,
    closeDeleteWorkoutModal,
    confirmWorkoutDeleting,
    isRemovingWorkout,
  };
};
