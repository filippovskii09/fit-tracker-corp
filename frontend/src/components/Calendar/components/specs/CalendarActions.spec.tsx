import { render, screen, userEvent } from '@testUtils';
import { DICTIONARY } from '@locales';
import { CalendarActions } from '../CalendarActions';

describe('CalendarActions', () => {
  it('should call backToday when Today button is clicked', async () => {
    const user = userEvent.setup();
    const mockBackToday = jest.fn();

    render(<CalendarActions backToday={mockBackToday} />, {});

    await user.click(
      screen.getByRole('button', {
        name: DICTIONARY.calendar.buttons.today,
      }),
    );

    expect(mockBackToday).toHaveBeenCalledTimes(1);
  });
});
