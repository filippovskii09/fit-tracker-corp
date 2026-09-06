import type { IItemCountVariant, SupportedItemCount } from './types';

export const MIN_ITEMS = 2;
export const MAX_ITEMS = 5;

// Item sizing per the handoff specimens (2-5 destinations). Keyed by item
// count so every rule is a data lookup instead of a branch — see design.md D5.
export const ITEM_COUNT_VARIANTS: Record<
  SupportedItemCount,
  IItemCountVariant
> = {
  2: {
    iconSize: 20,
    labelClass: 'text-[17px]',
    paddingClass: 'px-3',
    gapClass: 'gap-2',
  },
  3: {
    iconSize: 20,
    labelClass: 'text-[15px]',
    paddingClass: 'px-3',
    gapClass: 'gap-2',
  },
  4: {
    iconSize: 18,
    labelClass: 'text-[13px]',
    paddingClass: 'px-2',
    gapClass: 'gap-1.5',
  },
  5: {
    iconSize: 18,
    labelClass: 'text-[13px]',
    paddingClass: 'px-2',
    gapClass: 'gap-1.5',
    collapseInactive: {
      iconSize: 20,
      widthClass: 'w-11',
    },
  },
};

// Used only outside development when `items.length` is out of the supported
// 2-5 range: production renders what it was given instead of crashing the
// app (design.md D5), so an item count with no matching table entry falls
// back to the 4-item sizing rather than throwing on a missing lookup.
export const FALLBACK_VARIANT: IItemCountVariant = ITEM_COUNT_VARIANTS[4];
