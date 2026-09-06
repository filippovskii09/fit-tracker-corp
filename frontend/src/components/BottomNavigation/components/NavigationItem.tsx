import { NavLink, useLocation } from 'react-router-dom';
import type { KeyboardEvent } from 'react';

import type { INavigationItemProps } from '../types';

const SPACE_KEYS = [' ', 'Spacebar'];

const BASE_CLASSES =
  'flex h-control-md items-center justify-center rounded-3xl border transition-[color,border-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-main active:scale-[0.98]';

const getStateClasses = ({
  disabled,
  isActive,
}: {
  disabled: boolean;
  isActive: boolean;
}) => {
  if (disabled) {
    return 'pointer-events-none border-transparent font-normal text-disabled';
  }

  if (isActive) {
    return 'border-primary bg-transparent font-bold text-primary';
  }

  return 'border-transparent bg-transparent font-normal text-muted hover:text-text-subtle active:bg-[var(--app-text-hover-surface)]';
};

export const NavigationItem = ({ item, variant }: INavigationItemProps) => {
  const { icon: Icon, label, route, disabled = false } = item;
  const { collapseInactive } = variant;

  // Exact-match only (unlike NavLink's own `end: false` active-state
  // matching below, which intentionally also activates for descendant
  // locations). This decides whether re-activating the current item should
  // replace history instead of pushing a duplicate entry — see design.md D3
  // and the "Selecting the active item" scenario. A descendant location
  // (e.g. `/workouts/create` for the Workouts item) must still push a normal
  // entry when its own item is activated.
  const { pathname } = useLocation();
  const isCurrentRoute = pathname === route;

  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (disabled) {
      return;
    }

    if (SPACE_KEYS.includes(event.key)) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <NavLink
      to={route}
      replace={isCurrentRoute}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
        }
      }}
      onKeyDown={handleKeyDown}
      className={({ isActive }) => {
        const isCollapsed = Boolean(collapseInactive) && !isActive;
        const sizeClasses = isCollapsed
          ? `${collapseInactive!.widthClass} gap-0 px-0`
          : `flex-1 ${variant.paddingClass} ${variant.gapClass}`;

        return `${BASE_CLASSES} ${sizeClasses} ${getStateClasses({ disabled, isActive })}`;
      }}
    >
      {({ isActive }) => {
        const isCollapsed = Boolean(collapseInactive) && !isActive;
        const iconSize = isCollapsed
          ? collapseInactive!.iconSize
          : variant.iconSize;

        return (
          <>
            <Icon size={iconSize} aria-hidden />
            <span
              className={
                isCollapsed
                  ? 'sr-only'
                  : `${variant.labelClass} whitespace-nowrap`
              }
            >
              {label}
            </span>
          </>
        );
      }}
    </NavLink>
  );
};
