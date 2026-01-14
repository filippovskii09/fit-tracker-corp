import type {
  ICalendarDayCellPointProps,
  ICalendarDayCellProps,
} from '../types';

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
}: ICalendarDayCellProps) => {
  const baseClasses =
    'h-10 w-10 flex relative items-center justify-center font-medium text-xs rounded-xl transition-colors';
  const activeClasses = isCurrent ? 'bg-primary text-main font-bold' : '';
  const pointClasses = isCurrent ? 'bg-main' : 'bg-primary';

  return (
    <div
      key={day}
      className={`${baseClasses} ${activeClasses}`}
      style={isFirstDay ? { gridColumnStart: `${colStart}` } : {}}
    >
      {day}

      {hasWorkout && <CalendarDayCellPoint pointClasses={pointClasses} />}
    </div>
  );
};
