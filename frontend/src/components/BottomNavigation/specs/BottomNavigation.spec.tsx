import { useLocation, useNavigationType } from 'react-router-dom';

import { render, screen, userEvent } from '@testUtils';
import {
  FIVE_ITEMS,
  FOUR_ITEMS,
  HOME_ITEM,
  THREE_ITEMS,
  TWO_ITEMS,
  WORKOUTS_ITEM,
} from './fixtures';
import { BottomNavigation } from '..';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
};

const NavigationTypeProbe = () => {
  const navigationType = useNavigationType();
  return <div data-testid="navigation-type-probe">{navigationType}</div>;
};

const getIconSize = (name: string) =>
  Number(
    screen
      .getByRole('link', { name })
      .querySelector('svg')
      ?.getAttribute('width'),
  );

describe('BottomNavigation', () => {
  describe('item-count variants', () => {
    it.each([
      {
        items: TWO_ITEMS,
        iconSize: 20,
        labelClass: 'text-[17px]',
        paddingClass: 'px-3',
        gapClass: 'gap-2',
      },
      {
        items: THREE_ITEMS,
        iconSize: 20,
        labelClass: 'text-[15px]',
        paddingClass: 'px-3',
        gapClass: 'gap-2',
      },
      {
        items: FOUR_ITEMS,
        iconSize: 18,
        labelClass: 'text-[13px]',
        paddingClass: 'px-2',
        gapClass: 'gap-1.5',
      },
    ])(
      'applies the $items.length-item variant rules to every item',
      ({ items, iconSize, labelClass, paddingClass, gapClass }) => {
        render(<BottomNavigation items={items} />, {});

        items.forEach((item) => {
          const link = screen.getByRole('link', { name: item.label });

          expect(getIconSize(item.label)).toBe(iconSize);
          expect(link.className).toContain(paddingClass);
          expect(link.className).toContain(gapClass);

          const label = screen.getByText(item.label);
          expect(label.className).toContain(labelClass);
        });
      },
    );
  });

  describe('five-item collapse', () => {
    it('collapses inactive items to fixed 44px icon-only buttons and keeps the active item expanded', () => {
      render(<BottomNavigation items={FIVE_ITEMS} />, {
        route: HOME_ITEM.route,
      });

      const activeLink = screen.getByRole('link', { current: 'page' });
      expect(activeLink).toHaveAccessibleName(HOME_ITEM.label);
      expect(activeLink.className).toContain('flex-1');
      expect(activeLink.className).not.toContain('w-11');

      FIVE_ITEMS.filter((item) => item.route !== HOME_ITEM.route).forEach(
        (item) => {
          const link = screen.getByRole('link', { name: item.label });

          expect(link.className).toContain('w-11');
          expect(getIconSize(item.label)).toBe(20);
          // Label stays in the DOM as the accessible name while visually hidden.
          expect(screen.getByText(item.label)).toHaveClass('sr-only');
        },
      );
    });
  });

  describe('active resolution', () => {
    it('marks exactly one item as the current page when the route matches exactly', () => {
      render(<BottomNavigation items={TWO_ITEMS} />, {
        route: WORKOUTS_ITEM.route,
      });

      expect(screen.getAllByRole('link', { current: 'page' })).toHaveLength(1);
      expect(
        screen.getByRole('link', { name: WORKOUTS_ITEM.label }),
      ).toHaveAttribute('aria-current', 'page');
      expect(
        screen.getByRole('link', { name: HOME_ITEM.label }),
      ).not.toHaveAttribute('aria-current');
    });

    it('activates the ancestor item for a nested location', () => {
      render(<BottomNavigation items={TWO_ITEMS} />, {
        route: `${HOME_ITEM.route}/nested`,
      });

      expect(
        screen.getByRole('link', { name: HOME_ITEM.label }),
      ).toHaveAttribute('aria-current', 'page');
    });

    it('renders no active item when the route matches nothing, without crashing', () => {
      render(<BottomNavigation items={TWO_ITEMS} />, { route: '/no-match' });

      expect(
        screen.queryByRole('link', { current: 'page' }),
      ).not.toBeInTheDocument();
    });

    it('does not activate an item whose route is only a prefix of the current location', () => {
      render(<BottomNavigation items={TWO_ITEMS} />, {
        route: `${WORKOUTS_ITEM.route}-archive`,
      });

      expect(
        screen.getByRole('link', { name: WORKOUTS_ITEM.label }),
      ).not.toHaveAttribute('aria-current');
    });
  });

  describe('navigation behavior', () => {
    it('navigates to an inactive item on activation', async () => {
      const user = userEvent.setup();

      render(
        <>
          <BottomNavigation items={TWO_ITEMS} />
          <LocationProbe />
        </>,
        { route: HOME_ITEM.route },
      );

      await user.click(screen.getByRole('link', { name: WORKOUTS_ITEM.label }));

      expect(screen.getByTestId('location-probe')).toHaveTextContent(
        WORKOUTS_ITEM.route,
      );
    });

    it('activates via Enter and Space on keyboard focus', async () => {
      const user = userEvent.setup();

      render(
        <>
          <BottomNavigation items={TWO_ITEMS} />
          <LocationProbe />
        </>,
        { route: HOME_ITEM.route },
      );

      const workoutsLink = screen.getByRole('link', {
        name: WORKOUTS_ITEM.label,
      });
      workoutsLink.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('location-probe')).toHaveTextContent(
        WORKOUTS_ITEM.route,
      );

      const homeLink = screen.getByRole('link', { name: HOME_ITEM.label });
      homeLink.focus();
      await user.keyboard(' ');

      expect(screen.getByTestId('location-probe')).toHaveTextContent(
        HOME_ITEM.route,
      );
    });

    it('exposes a real href for every item', () => {
      render(<BottomNavigation items={TWO_ITEMS} />, {
        route: HOME_ITEM.route,
      });

      expect(
        screen.getByRole('link', { name: HOME_ITEM.label }),
      ).toHaveAttribute('href', HOME_ITEM.route);
      expect(
        screen.getByRole('link', { name: WORKOUTS_ITEM.label }),
      ).toHaveAttribute('href', WORKOUTS_ITEM.route);
    });

    it('replaces history instead of pushing when re-activating the already active item', async () => {
      const user = userEvent.setup();

      render(
        <>
          <BottomNavigation items={TWO_ITEMS} />
          <NavigationTypeProbe />
        </>,
        { route: HOME_ITEM.route },
      );

      await user.click(screen.getByRole('link', { name: HOME_ITEM.label }));

      expect(screen.getByTestId('navigation-type-probe')).toHaveTextContent(
        'REPLACE',
      );
    });

    it('pushes a new history entry when re-activating an item from a descendant location, rather than replacing', async () => {
      const user = userEvent.setup();

      render(
        <>
          <BottomNavigation items={TWO_ITEMS} />
          <NavigationTypeProbe />
        </>,
        { route: `${WORKOUTS_ITEM.route}/nested` },
      );

      await user.click(screen.getByRole('link', { name: WORKOUTS_ITEM.label }));

      expect(screen.getByTestId('navigation-type-probe')).toHaveTextContent(
        'PUSH',
      );
    });
  });

  describe('interaction states', () => {
    it('shows the muted/inactive state with no border by default', () => {
      render(<BottomNavigation items={TWO_ITEMS} />, {
        route: HOME_ITEM.route,
      });

      const inactiveLink = screen.getByRole('link', {
        name: WORKOUTS_ITEM.label,
      });

      expect(inactiveLink.className).toContain('text-muted');
      expect(inactiveLink.className).toContain('hover:text-text-subtle');
      expect(inactiveLink.className).toContain('border-transparent');
    });

    it('shows a focus-visible ring on the item, not the track', () => {
      render(<BottomNavigation items={TWO_ITEMS} />, {
        route: HOME_ITEM.route,
      });

      const link = screen.getByRole('link', { name: WORKOUTS_ITEM.label });
      expect(link.className).toContain('focus-visible:ring-focus-ring');

      const track = screen.getByRole('navigation');
      expect(track.className).not.toContain('focus-visible:ring');
    });

    it('does not navigate or respond to interaction for a disabled item', async () => {
      const user = userEvent.setup();
      const items = [HOME_ITEM, { ...WORKOUTS_ITEM, disabled: true }];

      render(
        <>
          <BottomNavigation items={items} />
          <LocationProbe />
        </>,
        { route: HOME_ITEM.route },
      );

      const disabledLink = screen.getByRole('link', {
        name: WORKOUTS_ITEM.label,
      });

      expect(disabledLink).toHaveAttribute('aria-disabled', 'true');
      expect(disabledLink.className).toContain('pointer-events-none');
      expect(disabledLink.className).toContain('text-disabled');

      await user.click(disabledLink);

      expect(screen.getByTestId('location-probe')).toHaveTextContent(
        HOME_ITEM.route,
      );

      disabledLink.focus();
      await user.keyboard(' ');

      expect(screen.getByTestId('location-probe')).toHaveTextContent(
        HOME_ITEM.route,
      );
    });
  });

  describe('development guard', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('throws when fewer than 2 items are supplied', () => {
      process.env.NODE_ENV = 'development';
      expect(() =>
        render(<BottomNavigation items={[HOME_ITEM]} />, {}),
      ).toThrow(/between 2 and 5 items/);
    });

    it('throws when more than 5 items are supplied', () => {
      process.env.NODE_ENV = 'development';
      const items = [...FIVE_ITEMS, HOME_ITEM];

      expect(() => render(<BottomNavigation items={items} />, {})).toThrow(
        /between 2 and 5 items/,
      );
    });

    it('does not throw in production, rendering what it was given', () => {
      process.env.NODE_ENV = 'production';

      expect(() =>
        render(<BottomNavigation items={[HOME_ITEM]} />, {}),
      ).not.toThrow();
    });
  });
});
