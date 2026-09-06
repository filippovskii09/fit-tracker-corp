import type { INavigationItemModel } from '../types';
import {
  FifthIcon,
  FourthIcon,
  HomeIcon,
  ThirdIcon,
  WorkoutsIcon,
} from './icons';

export const HOME_ITEM: INavigationItemModel = {
  icon: HomeIcon,
  label: 'Home',
  route: '/dashboard',
};

export const WORKOUTS_ITEM: INavigationItemModel = {
  icon: WorkoutsIcon,
  label: 'Workouts',
  route: '/workouts',
};

export const THIRD_ITEM: INavigationItemModel = {
  icon: ThirdIcon,
  label: 'Progress',
  route: '/progress',
};

export const FOURTH_ITEM: INavigationItemModel = {
  icon: FourthIcon,
  label: 'Profile',
  route: '/profile',
};

export const FIFTH_ITEM: INavigationItemModel = {
  icon: FifthIcon,
  label: 'Settings',
  route: '/settings',
};

export const TWO_ITEMS = [HOME_ITEM, WORKOUTS_ITEM];
export const THREE_ITEMS = [HOME_ITEM, WORKOUTS_ITEM, THIRD_ITEM];
export const FOUR_ITEMS = [HOME_ITEM, WORKOUTS_ITEM, THIRD_ITEM, FOURTH_ITEM];
export const FIVE_ITEMS = [
  HOME_ITEM,
  WORKOUTS_ITEM,
  THIRD_ITEM,
  FOURTH_ITEM,
  FIFTH_ITEM,
];
