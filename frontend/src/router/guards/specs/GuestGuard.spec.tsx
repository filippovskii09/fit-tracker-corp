import { Route, Routes } from 'react-router-dom';

import { render, screen } from '@testUtils';
import { APP_ROUTES } from '@constants';
import { GuestGuard } from '../GuestGuard';

describe('GuestGuard', () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should render outlet (child content) if user is NOT authenticated', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    render(
      <Routes>
        <Route element={<GuestGuard />}>
          <Route
            path={APP_ROUTES.AUTH.SIGNIN}
            element={<div>Login Page</div>}
          />
        </Route>
        <Route path="*" element={null} />
      </Routes>,
      { route: APP_ROUTES.AUTH.SIGNIN },
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should redirect to ROOT if user IS authenticated', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('valid-token');

    render(
      <Routes>
        <Route path={APP_ROUTES.AUTH.SIGNIN} element={<GuestGuard />}>
          <Route path="" element={<div>Login Page</div>} />
        </Route>
        <Route path="*" element={null} />
        <Route
          path={APP_ROUTES.DASHBOARD}
          element={<div>Dashboard Page</div>}
        />
      </Routes>,
      { route: APP_ROUTES.AUTH.SIGNIN },
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
