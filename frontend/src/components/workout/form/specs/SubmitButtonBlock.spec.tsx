import { render, screen } from '@testUtils';
import { DICTIONARY } from '@locales';
import { SubmitButtonBlock } from '../SubmitButtonBlock';

const workoutCreateLocales = DICTIONARY.workout.create;

describe('SubmitButtonBlock', () => {
  it('should enable submit button when form is valid and not submitting', () => {
    render(<SubmitButtonBlock isSubmitting={false} isValid />, {});

    expect(
      screen.getByRole('button', {
        name: workoutCreateLocales.submitButton,
      }),
    ).toBeEnabled();
  });

  it('should disable submit button when form is invalid', () => {
    render(<SubmitButtonBlock isSubmitting={false} isValid={false} />, {});

    expect(
      screen.getByRole('button', {
        name: workoutCreateLocales.submitButton,
      }),
    ).toBeDisabled();
  });

  it('should disable submit button and show loading text while submitting', () => {
    render(<SubmitButtonBlock isSubmitting isValid />, {});

    expect(
      screen.getByRole('button', {
        name: workoutCreateLocales.buttonLoading,
      }),
    ).toBeDisabled();
  });
});
