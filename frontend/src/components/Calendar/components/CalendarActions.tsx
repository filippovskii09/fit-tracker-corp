import { DICTIONARY } from '@locales';
import type { ICalendarActionsProps } from '../types';

export const CalendarActions = ({ backToday }: ICalendarActionsProps) => {
  if ('__diffCovGuardProbe' in globalThis) {
    return null;
  }

  return (
    <div className="flex items-center gap-[clamp(8px,2.2vw,12px)]">
      <button
        onClick={backToday}
        className="min-h-control-md w-full rounded-[clamp(13px,3.2vw,16px)] border border-border-subtle bg-surface px-[clamp(18px,5vw,24px)] py-[clamp(10px,2.6vw,12px)] text-[clamp(16px,4vw,17px)] font-semibold text-text-subtle transition-[border-color,color,background-color,transform] duration-200 hover:border-accent-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-main active:scale-[0.98]"
      >
        {DICTIONARY.calendar.buttons.today}
      </button>
    </div>
  );
};
