import { Calendar } from '@components';
import { BaseModal } from '@ui';
import { useDashboardPage } from './hooks';

export const DashboardPage = () => {
  const {
    isCreateWorkoutModalOpen,
    closeCreateWorkoutModalOpenModal,
    confirmWorkoutCreating,
    openModalByClickOnDayCell,
    data,
    WORKOUT_CREATE,
  } = useDashboardPage();

  return (
    <div className="flex justify-center mt-14">
      <Calendar
        workouts={data || []}
        openModalByClickOnDayCell={openModalByClickOnDayCell}
      />
      <BaseModal
        open={isCreateWorkoutModalOpen}
        onClose={closeCreateWorkoutModalOpenModal}
        onConfirm={confirmWorkoutCreating}
        title={WORKOUT_CREATE.TITLE}
        text={WORKOUT_CREATE.TEXT}
        cancelButtonText={WORKOUT_CREATE.CANCEL_BUTTON_TEXT}
        confirmButtonText={WORKOUT_CREATE.CONFIRM_BUTTON_TEXT}
      />
    </div>
  );
};
