import { Route, Routes } from 'react-router-dom';

import { render, screen } from '@testUtils';
import { DICTIONARY } from '@locales';
import { AppLayout } from '../AppLayout';

describe('AppLayout', () => {
  it('renders the outlet content together with the navigation', () => {
    render(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' },
    );

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: DICTIONARY.navigation.ariaLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: DICTIONARY.navigation.home }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('applies the layout-owned bottom content offset to the outlet wrapper', () => {
    render(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' },
    );

    const content = screen.getByText('Dashboard content');
    expect(content.parentElement).toHaveClass('pb-28');
  });
});
