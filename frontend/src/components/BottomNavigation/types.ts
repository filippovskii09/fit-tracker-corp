import type { IconType } from 'react-icons';

export interface INavigationItemModel {
  icon: IconType;
  label: string;
  route: string;
  disabled?: boolean;
}

export type SupportedItemCount = 2 | 3 | 4 | 5;

export interface ICollapseInactiveVariant {
  iconSize: number;
  widthClass: string;
}

export interface IItemCountVariant {
  iconSize: number;
  labelClass: string;
  paddingClass: string;
  gapClass: string;
  collapseInactive?: ICollapseInactiveVariant;
}

export interface IBottomNavigationProps {
  items: readonly INavigationItemModel[];
}

export interface INavigationItemProps {
  item: INavigationItemModel;
  variant: IItemCountVariant;
}
