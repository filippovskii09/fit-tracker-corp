import { Calendar } from '@components';
import { BaseModal } from '@ui';
import { useDashboardPage } from './hooks';

const DashboardPage = () => {
  const {
    isCreateWorkoutModalOpen,
    closeCreateWorkoutModalOpenModal,
    confirmWorkoutCreating,
    openModalByClickOnDayCell,
    data,
    WORKOUT_CREATE,
    onSelectDate,
  } = useDashboardPage();

  return (
    <div className="flex justify-center mt-6">
      <Calendar
        workouts={data || []}
        openModalByClickOnDayCell={openModalByClickOnDayCell}
        onSelectDate={onSelectDate}
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

export default DashboardPage;
