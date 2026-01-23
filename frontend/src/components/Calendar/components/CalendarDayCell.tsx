import { useNavigate } from 'react-router-dom';
import type {
  ICalendarDayCellPointProps,
  ICalendarDayCellProps,
} from '../types';
import { APP_ROUTES } from '@constants';

const CalendarDayCellPoint = ({ pointClasses }: ICalendarDayCellPointProps) => (
  <span
    className={`w-2 h-2 ${pointClasses} rounded-full absolute left-1/2 -translate-x-1/2 bottom-0.5`}
  ></span>
);

export const CalendarDayCell = ({
  day,
  isCurrent,
  hasWorkout,
  colStart,
  isFirstDay,
  openModalByClickOnDayCell,
  initialWorkoutId,
}: ICalendarDayCellProps) => {
  const navigate = useNavigate();
  const baseClasses =
    'h-10 w-10 flex relative items-center justify-center font-medium text-xs rounded-xl transition-colors';
  const activeClasses = isCurrent ? 'bg-primary text-main font-bold' : '';
  const pointClasses = isCurrent ? 'bg-main' : 'bg-primary';

  const handleClick = () => {
    if (hasWorkout) {
      navigate(`${APP_ROUTES.WORKOUTS.ROOT}/${initialWorkoutId}`);
    } else {
      openModalByClickOnDayCell();
    }
  };

  return (
    <button
      key={day}
      className={`${baseClasses} ${activeClasses}`}
      style={isFirstDay ? { gridColumnStart: `${colStart}` } : {}}
      onClick={handleClick}
    >
      {day}

      {hasWorkout && <CalendarDayCellPoint pointClasses={pointClasses} />}
    </button>
  );
};
