import { waitFor } from '@testing-library/react';

import { profileService } from '@services';
import { renderHook } from '@utils';
import { useUser } from '../useUser';

jest.mock('@services', () => ({
  profileService: {
    getMe: jest.fn(),
  },
}));

describe('useUser Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should fetch user data if access token exists', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    localStorage.setItem('accessToken', 'valid-token');

    (profileService.getMe as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUser);
    expect(profileService.getMe).toHaveBeenCalledTimes(1);
  });

  it('should NOT fetch data if access token is missing (enabled: false)', async () => {
    localStorage.removeItem('accessToken');

    const { result } = renderHook(() => useUser());

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
    expect(profileService.getMe).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    localStorage.setItem('accessToken', 'valid-token');
    const mockError = new Error('Network Error');
    (profileService.getMe as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(profileService.getMe).toHaveBeenCalledTimes(1);
  });
});
