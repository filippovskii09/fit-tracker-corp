import { render, screen, userEvent } from '@testUtils';
import { DICTIONARY } from '@locales';
import { MONTH_NAMES } from '../../constants';
import { CALENDAR_YEAR } from './fixtures';
import { MonthSwitcher } from '../MonthSwitcher';

const calendarButtons = DICTIONARY.calendar.buttons;

describe('MonthSwitcher', () => {
  const mockPrevMonth = jest.fn();
  const mockNextMonth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render current month and year', () => {
    render(
      <MonthSwitcher
        prevMonth={mockPrevMonth}
        nextMonth={mockNextMonth}
        month={MONTH_NAMES[0]}
        year={CALENDAR_YEAR}
      />,
      {},
    );

    expect(screen.getByText(MONTH_NAMES[0])).toBeInTheDocument();
    expect(screen.getByText(CALENDAR_YEAR)).toBeInTheDocument();
  });

  it('should call month navigation handlers', async () => {
    const user = userEvent.setup();

    render(
      <MonthSwitcher
        prevMonth={mockPrevMonth}
        nextMonth={mockNextMonth}
        month={MONTH_NAMES[0]}
        year={CALENDAR_YEAR}
      />,
      {},
    );

    await user.click(
      screen.getByRole('button', {
        name: calendarButtons.previousMonth,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: calendarButtons.nextMonth,
      }),
    );

    expect(mockPrevMonth).toHaveBeenCalledTimes(1);
    expect(mockNextMonth).toHaveBeenCalledTimes(1);
  });
});
