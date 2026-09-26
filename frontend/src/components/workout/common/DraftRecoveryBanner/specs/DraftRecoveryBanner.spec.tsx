import { DICTIONARY } from '@locales';
import { render, screen, userEvent } from '@testUtils';
import { DraftRecoveryBanner } from '../index';

describe('DraftRecoveryBanner', () => {
  const { draft } = DICTIONARY.workout.create;

  it('renders a labelled region with the recovery message', () => {
    render(
      <DraftRecoveryBanner onRestore={jest.fn()} onDiscard={jest.fn()} />,
      {
        route: '/',
      },
    );

    expect(
      screen.getByRole('region', { name: draft.recoveredMessage }),
    ).toHaveTextContent(draft.recoveredMessage);
  });

  it('calls onRestore when Restore is clicked', async () => {
    const onRestore = jest.fn();
    render(
      <DraftRecoveryBanner onRestore={onRestore} onDiscard={jest.fn()} />,
      {
        route: '/',
      },
    );

    await userEvent.click(screen.getByRole('button', { name: draft.restore }));

    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard when Discard is clicked', async () => {
    const onDiscard = jest.fn();
    render(
      <DraftRecoveryBanner onRestore={jest.fn()} onDiscard={onDiscard} />,
      {
        route: '/',
      },
    );

    await userEvent.click(screen.getByRole('button', { name: draft.discard }));

    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
