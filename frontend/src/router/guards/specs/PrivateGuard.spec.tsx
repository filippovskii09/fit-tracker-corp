import { Route, Routes } from 'react-router-dom';

import { render, screen } from '@utils';
import { APP_ROUTES } from '@constants';
import { useUser } from '@hooks';
import { PrivateGuard } from '../PrivateGuard';

jest.mock('@hooks', () => ({
  useUser: jest.fn(),
}));

describe('PrivateGuard', () => {
  const mockUseUser = useUser as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should redirect to SIGNIN if NO token is present (even if loading)', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    mockUseUser.mockReturnValue({ isLoading: true, data: null });

    render(
      <Routes>
        <Route element={<PrivateGuard />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path={APP_ROUTES.AUTH.SIGNIN} element={<div>Signin Page</div>} />
        <Route path="*" element={null} />
      </Routes>,
      { route: '/protected' },
    );

    expect(screen.getByText('Signin Page')).toBeInTheDocument();
  });

  it('should show LOADING spinner if token exists and query is loading', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('valid-token');
    mockUseUser.mockReturnValue({ isLoading: true, data: undefined });

    render(
      <Routes>
        <Route element={<PrivateGuard />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>,
      { route: '/protected' },
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to SIGNIN if token exists but query returns ERROR', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('valid-token');
    mockUseUser.mockReturnValue({
      isLoading: false,
      isError: true,
      data: null,
    });

    render(
      <Routes>
        <Route element={<PrivateGuard />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path={APP_ROUTES.AUTH.SIGNIN} element={<div>Signin Page</div>} />
        <Route path="*" element={null} />
      </Routes>,
      { route: '/protected' },
    );

    expect(screen.getByText('Signin Page')).toBeInTheDocument();
  });

  it('should render OUTLET (content) if token exists and user data loaded', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('valid-token');
    mockUseUser.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { id: 1, email: 'test@test.com' },
    });

    render(
      <Routes>
        <Route element={<PrivateGuard />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="*" element={null} />
      </Routes>,
      { route: '/protected' },
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
