import { DICTIONARY } from '@locales';
import type { ICalendarActionsProps } from '../types';

export const CalendarActions = ({ backToday }: ICalendarActionsProps) => {
  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={backToday}
        className="py-1 px-4 bg-surface w-full rounded-lg"
      >
        {DICTIONARY.calendar.buttons.today}
      </button>
    </div>
  );
};
