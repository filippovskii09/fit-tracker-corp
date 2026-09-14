import { render, screen, userEvent } from '@testUtils';
import { DICTIONARY } from '@locales';
import { LibraryTabs } from '..';

const { programs, exercises } = DICTIONARY.libraryTabs;

describe('LibraryTabs', () => {
  it('renders both choices with their labels and counts, Programs selected initially', () => {
    render(<LibraryTabs />, {});

    const programsTab = screen.getByRole('button', { name: `${programs} 12` });
    const exercisesTab = screen.getByRole('button', {
      name: `${exercises} 240`,
    });

    expect(programsTab).toHaveAttribute('aria-pressed', 'true');
    expect(exercisesTab).toHaveAttribute('aria-pressed', 'false');
  });

  it('selects Exercises and deselects Programs when Exercises is activated', async () => {
    const user = userEvent.setup();
    render(<LibraryTabs />, {});

    await user.click(screen.getByRole('button', { name: `${exercises} 240` }));

    expect(
      screen.getByRole('button', { name: `${programs} 12` }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.getByRole('button', { name: `${exercises} 240` }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('returns to Programs when it is activated again after Exercises was selected', async () => {
    const user = userEvent.setup();
    render(<LibraryTabs />, {});

    await user.click(screen.getByRole('button', { name: `${exercises} 240` }));
    await user.click(screen.getByRole('button', { name: `${programs} 12` }));

    expect(
      screen.getByRole('button', { name: `${programs} 12` }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: `${exercises} 240` }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('leaves the current choice selected when it is activated again', async () => {
    const user = userEvent.setup();
    render(<LibraryTabs />, {});

    const programsTab = screen.getByRole('button', { name: `${programs} 12` });
    await user.click(programsTab);

    expect(programsTab).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: `${exercises} 240` }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps counts unchanged when switching between choices', async () => {
    const user = userEvent.setup();
    render(<LibraryTabs />, {});

    await user.click(screen.getByRole('button', { name: `${exercises} 240` }));
    await user.click(screen.getByRole('button', { name: `${programs} 12` }));

    expect(
      screen.getByRole('button', { name: `${programs} 12` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `${exercises} 240` }),
    ).toBeInTheDocument();
  });
});
