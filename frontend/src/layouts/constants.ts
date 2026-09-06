import { IoMdFitness, IoMdHome } from 'react-icons/io';

import type { INavigationItemModel } from '@components';
import { APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';

// Single source of truth for the app's top-level destinations (design.md D2).
// BottomNavigation stays a pure presentational component; only the layout
// knows which routes exist.
export const NAV_ITEMS: readonly INavigationItemModel[] = Object.freeze([
  {
    icon: IoMdHome,
    label: DICTIONARY.navigation.home,
    route: APP_ROUTES.DASHBOARD,
  },
  {
    icon: IoMdFitness,
    label: DICTIONARY.navigation.workouts,
    route: APP_ROUTES.WORKOUTS.ROOT,
  },
]);
