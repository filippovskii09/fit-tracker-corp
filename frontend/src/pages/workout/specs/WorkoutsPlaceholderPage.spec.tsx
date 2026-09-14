import { DICTIONARY } from '@locales';
import { render, screen } from '@testUtils';

import WorkoutsPlaceholderPage from '../placeholder/WorkoutsPlaceholderPage';

describe('WorkoutsPlaceholderPage', () => {
  it('renders the RoutineFilters control above the "Soon" message', () => {
    render(<WorkoutsPlaceholderPage />, {});

    const filtersControl = screen.getByRole('button', {
      name: DICTIONARY.routineFilters.level.label,
    });
    const soonMessage = screen.getByText(DICTIONARY.workout.placeholder.soon);

    expect(filtersControl).toBeInTheDocument();
    expect(soonMessage).toBeInTheDocument();

    expect(
      filtersControl.compareDocumentPosition(soonMessage) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
