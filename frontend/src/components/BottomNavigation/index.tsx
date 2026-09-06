import { DICTIONARY } from '@locales';
import { NavigationItem } from './components';
import {
  FALLBACK_VARIANT,
  ITEM_COUNT_VARIANTS,
  MAX_ITEMS,
  MIN_ITEMS,
} from './constants';
import type { IBottomNavigationProps, SupportedItemCount } from './types';

export type * from './types';

export const BottomNavigation = ({ items }: IBottomNavigationProps) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    (items.length < MIN_ITEMS || items.length > MAX_ITEMS)
  ) {
    throw new Error(
      `BottomNavigation requires between ${MIN_ITEMS} and ${MAX_ITEMS} items, received ${items.length}.`,
    );
  }

  const variant =
    ITEM_COUNT_VARIANTS[items.length as SupportedItemCount] ?? FALLBACK_VARIANT;

  return (
    <nav
      aria-label={DICTIONARY.navigation.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-112 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-6 bottom-0 -z-10 bg-gradient-to-t from-main to-transparent"
      />
      <div className="relative flex h-control-lg items-center gap-1 rounded-[29px] border border-border-subtle bg-surface p-1">
        {items.map((item) => (
          <NavigationItem key={item.route} item={item} variant={variant} />
        ))}
      </div>
    </nav>
  );
};
