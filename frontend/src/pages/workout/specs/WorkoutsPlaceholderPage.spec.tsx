import { DICTIONARY } from '@locales';
import { render, screen, userEvent } from '@testUtils';

import WorkoutsPlaceholderPage from '../placeholder/WorkoutsPlaceholderPage';

describe('WorkoutsPlaceholderPage', () => {
  it('renders the tabs, then the RoutineFilters control, then the "Soon" message, in that order', () => {
    render(<WorkoutsPlaceholderPage />, {});

    const programsTab = screen.getByRole('button', {
      name: `${DICTIONARY.libraryTabs.programs} 12`,
    });
    const filtersControl = screen.getByRole('button', {
      name: DICTIONARY.routineFilters.level.label,
    });
    const soonMessage = screen.getByText(DICTIONARY.workout.placeholder.soon);

    expect(programsTab).toBeInTheDocument();
    expect(filtersControl).toBeInTheDocument();
    expect(soonMessage).toBeInTheDocument();

    expect(
      programsTab.compareDocumentPosition(filtersControl) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      filtersControl.compareDocumentPosition(soonMessage) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('preserves a selected routine filter and the "Soon" message when switching tabs', async () => {
    const user = userEvent.setup();
    render(<WorkoutsPlaceholderPage />, {});

    await user.click(
      screen.getByRole('button', {
        name: DICTIONARY.routineFilters.level.label,
      }),
    );
    await user.click(
      screen.getByRole('option', {
        name: DICTIONARY.routineFilters.level.options.beginner,
      }),
    );

    await user.click(
      screen.getByRole('button', {
        name: `${DICTIONARY.libraryTabs.exercises} 240`,
      }),
    );

    expect(
      screen.getByRole('button', {
        name: DICTIONARY.routineFilters.level.options.beginner,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(DICTIONARY.workout.placeholder.soon),
    ).toBeInTheDocument();
  });
});
