import { Outlet } from 'react-router-dom';

import { BottomNavigation } from '@components';
import { NAV_ITEMS } from './constants';

// Content offset owned by the layout, not by pages (design.md D1/D7): 112px
// (`pb-28`) clears the nav-only fixed bar. The handoff also specifies a 200px
// variant for a primary CTA stacked above the nav in the same fixed bar; no
// screen under this layout has one yet, so it is documented here rather than
// wired as dead conditional logic. The screen that first needs it should
// apply that offset itself instead of branching this constant on nothing.
export const AppLayout = () => (
  <div className="mx-auto flex min-h-dvh w-full max-w-112 flex-col">
    <div className="flex-1 pb-28">
      <Outlet />
    </div>
    <BottomNavigation items={NAV_ITEMS} />
  </div>
);
