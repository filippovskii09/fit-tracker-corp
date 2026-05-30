import { FaRegTrashAlt } from 'react-icons/fa';
import { CircularProgress } from '@mui/material';

import { DICTIONARY } from '@locales';
import { BaseModal } from '@ui';
import { useDeleteWorkoutAction } from './hooks';

export const DeleteWorkoutAction = () => {
  const { remove } = DICTIONARY.workout;
  const { WORKOUT_DELETE } = DICTIONARY.modals;

  const {
    isDeleteWorkoutModalOpen,
    openDeleteWorkoutModal,
    closeDeleteWorkoutModal,
    confirmWorkoutDeleting,
    isRemovingWorkout,
  } = useDeleteWorkoutAction();

  return (
    <>
      <button
        className={`relative text-red-400 w-12 h-12 flex items-center justify-center rounded-2xl bg-red-400/10 disabled:grayscale`}
        onClick={openDeleteWorkoutModal}
        aria-label={remove.ariaLabel}
        disabled={isRemovingWorkout}
      >
        {isRemovingWorkout ? (
          <CircularProgress
            aria-label={remove.removing}
            size={24}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: '-12px',
              marginLeft: '-12px',
            }}
          />
        ) : (
          <FaRegTrashAlt />
        )}
      </button>

      <BaseModal
        open={isDeleteWorkoutModalOpen}
        onClose={closeDeleteWorkoutModal}
        onConfirm={confirmWorkoutDeleting}
        title={WORKOUT_DELETE.TITLE}
        text={WORKOUT_DELETE.TEXT}
        cancelButtonText={WORKOUT_DELETE.CANCEL_BUTTON_TEXT}
        confirmButtonText={WORKOUT_DELETE.CONFIRM_BUTTON_TEXT}
      />
    </>
  );
};
