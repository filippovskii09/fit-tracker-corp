import { useNavigate } from 'react-router-dom';

import { ACCESS_TOKEN_STORAGE_KEY, APP_ROUTES } from '@constants';
import { render, screen, userEvent } from '@testUtils';
import { storeReturnTo } from '@utils';
import { SigninForm } from '../index';
import { useSignin } from '../../../queries';

jest.mock('../../../queries', () => ({
  useSignin: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const tokenFor = (userId: string): string =>
  `h.${btoa(JSON.stringify({ sub: userId, exp: 9999999999 }))}.s`;

describe('SigninForm', () => {
  const mockNavigate = jest.fn();
  const mockedUseNavigate = useNavigate as jest.Mock;
  const mockedUseSignin = useSignin as jest.Mock;

  const fillAndSubmit = async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it('restores the sanitized returnTo route when it belongs to the newly signed-in user', async () => {
    const userId = 'user-1';
    const accessToken = tokenFor(userId);
    storeReturnTo('/workouts/create?date=2024-01-01', userId);

    mockedUseSignin.mockReturnValue({
      mutate: (_values: unknown, opts: { onSuccess: (d: unknown) => void }) =>
        opts.onSuccess({ accessToken, message: 'ok' }),
      isPending: false,
    });

    render(<SigninForm />, { route: APP_ROUTES.AUTH.SIGNIN });
    await fillAndSubmit();

    expect(mockNavigate).toHaveBeenCalledWith(
      '/workouts/create?date=2024-01-01',
    );
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe(accessToken);
  });

  it('falls back to the dashboard when the preserved route belongs to a different user', async () => {
    const accessToken = tokenFor('user-2');
    storeReturnTo('/workouts/create?date=2024-01-01', 'user-1');

    mockedUseSignin.mockReturnValue({
      mutate: (_values: unknown, opts: { onSuccess: (d: unknown) => void }) =>
        opts.onSuccess({ accessToken, message: 'ok' }),
      isPending: false,
    });

    render(<SigninForm />, { route: APP_ROUTES.AUTH.SIGNIN });
    await fillAndSubmit();

    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.DASHBOARD);
  });

  it('falls back to the dashboard when there is no preserved route', async () => {
    mockedUseSignin.mockReturnValue({
      mutate: (_values: unknown, opts: { onSuccess: (d: unknown) => void }) =>
        opts.onSuccess({ accessToken: tokenFor('user-1'), message: 'ok' }),
      isPending: false,
    });

    render(<SigninForm />, { route: APP_ROUTES.AUTH.SIGNIN });
    await fillAndSubmit();

    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.DASHBOARD);
  });
});
