import { render, screen, userEvent, within } from '@testUtils';
import { DICTIONARY } from '@locales';
import { RoutineFilters } from '..';

const { level, goal, gear, days } = DICTIONARY.routineFilters;

describe('RoutineFilters', () => {
  describe('initial render', () => {
    it('renders all four filters as unselected dropdown triggers', () => {
      render(<RoutineFilters />, {});

      [level.label, goal.label, gear.label, days.label].forEach((label) => {
        const trigger = screen.getByRole('button', { name: label });
        expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });

      expect(
        screen.queryByRole('button', { name: /remove/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('opening a dropdown', () => {
    it('opens the filter dropdown and shows the active state on its trigger', async () => {
      const user = userEvent.setup();
      render(<RoutineFilters />, {});

      const trigger = screen.getByRole('button', { name: goal.label });
      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const listbox = screen.getByRole('listbox', { name: goal.label });
      expect(
        within(listbox).getByRole('option', { name: goal.options.hypertrophy }),
      ).toBeInTheDocument();
    });

    it('closes any other open dropdown when a new one opens', async () => {
      const user = userEvent.setup();
      render(<RoutineFilters />, {});

      await user.click(screen.getByRole('button', { name: goal.label }));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: gear.label }));

      const listboxes = screen.getAllByRole('listbox');
      expect(listboxes).toHaveLength(1);
      expect(listboxes[0]).toHaveAccessibleName(gear.label);
      expect(screen.getByRole('button', { name: goal.label })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('closes the dropdown when the Escape key is pressed and returns focus to the trigger', async () => {
      const user = userEvent.setup();
      render(<RoutineFilters />, {});

      const trigger = screen.getByRole('button', { name: goal.label });
      await user.click(trigger);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveFocus();
    });

    it('closes the dropdown when its own trigger is clicked again', async () => {
      const user = userEvent.setup();
      render(<RoutineFilters />, {});

      const trigger = screen.getByRole('button', { name: goal.label });
      await user.click(trigger);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.click(trigger);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('selecting an option', () => {
    it('closes the dropdown and replaces the trigger with a selected chip', async () => {
      const user = userEvent.setup();
      render(<RoutineFilters />, {});

      await user.click(screen.getByRole('button', { name: level.label }));
      await user.click(
        screen.getByRole('option', { name: level.options.beginner }),
      );

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: level.label }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: level.options.beginner }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: `${DICTIONARY.routineFilters.removeFilterLabel} ${level.label}`,
        }),
      ).toBeInTheDocument();
    });

    it('replaces the previous selection when choosing a different option', async () => {
      const user = userEvent.setup();
      render(<RoutineFilters />, {});

      await user.click(screen.getByRole('button', { name: level.label }));
      await user.click(
        screen.getByRole('option', { name: level.options.beginner }),
      );

      await user.click(
        screen.getByRole('button', { name: level.options.beginner }),
      );
      await user.click(
        screen.getByRole('option', { name: level.options.advanced }),
      );

      expect(
        screen.queryByRole('button', { name: level.options.beginner }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: level.options.advanced }),
      ).toBeInTheDocument();
    });
  });

  describe('reopening a selected filter', () => {
    it('shows the current selection distinguished from the other options', async () => {
      const user = userEvent.setup();
      render(<RoutineFilters />, {});

      await user.click(screen.getByRole('button', { name: goal.label }));
      await user.click(
        screen.getByRole('option', { name: goal.options.hypertrophy }),
      );

      await user.click(
        screen.getByRole('button', { name: goal.options.hypertrophy }),
      );

      const selectedOption = screen.getByRole('option', {
        name: goal.options.hypertrophy,
      });
      const otherOption = screen.getByRole('option', {
        name: goal.options.strength,
      });

      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
      expect(otherOption).toHaveAttribute('aria-selected', 'false');
      expect(selectedOption.className).not.toBe(otherOption.className);
    });
  });

  describe('clearing a selected filter', () => {
    it('clears the selection and restores the original trigger without affecting other filters', async () => {
      const user = userEvent.setup();
      render(<RoutineFilters />, {});

      await user.click(screen.getByRole('button', { name: level.label }));
      await user.click(
        screen.getByRole('option', { name: level.options.beginner }),
      );

      await user.click(screen.getByRole('button', { name: goal.label }));
      await user.click(
        screen.getByRole('option', { name: goal.options.hypertrophy }),
      );

      await user.click(
        screen.getByRole('button', {
          name: `${DICTIONARY.routineFilters.removeFilterLabel} ${level.label}`,
        }),
      );

      expect(
        screen.getByRole('button', { name: level.label }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: level.options.beginner }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: goal.options.hypertrophy }),
      ).toBeInTheDocument();
    });
  });

  describe('independence across filters', () => {
    it('does not change one filter selection when opening and selecting in another', async () => {
      const user = userEvent.setup();
      render(<RoutineFilters />, {});

      await user.click(screen.getByRole('button', { name: level.label }));
      await user.click(
        screen.getByRole('option', { name: level.options.beginner }),
      );

      await user.click(screen.getByRole('button', { name: goal.label }));
      await user.click(
        screen.getByRole('option', { name: goal.options.strength }),
      );

      expect(
        screen.getByRole('button', { name: level.options.beginner }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: goal.options.strength }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
