import { DICTIONARY } from '@locales';
import type { ICalendarActionsProps } from '../types';

export const CalendarActions = ({ backToday }: ICalendarActionsProps) => {
  return (
    <div className="flex items-center gap-[clamp(8px,2.2vw,12px)]">
      <button
        onClick={backToday}
        className="w-full rounded-[clamp(10px,2.5vw,14px)] bg-surface px-[clamp(16px,5vw,24px)] py-[clamp(6px,2vw,10px)] text-[clamp(14px,3.2vw,16px)]"
      >
        {DICTIONARY.calendar.buttons.today}
      </button>
    </div>
  );
};
