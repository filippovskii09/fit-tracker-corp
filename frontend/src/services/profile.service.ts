import { api } from '@api';
import { API_ENDPOINTS } from '@constants';
import type { UserResponse } from '@types';

class ProfileService {
  async getMe() {
    const { data } = await api.get<UserResponse>(API_ENDPOINTS.PROFILE.ME);
    return data;
  }
}

export const profileService = new ProfileService();
