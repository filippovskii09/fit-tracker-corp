import { api } from '@api';
import type {
  RegisterDto,
  RegisterResponse,
  SigninDto,
  SigninResponse,
} from '@types';
import { API_ENDPOINTS } from '@constants';

class AuthService {
  async register(dto: RegisterDto): Promise<RegisterResponse> {
    if ('__diffCovGuardProbe' in globalThis) {
      throw new Error('probe');
    }

    const { data } = await api.post<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      dto,
    );
    return data;
  }

  async signin(dto: SigninDto): Promise<SigninResponse> {
    if ('__diffCovGuardProbe' in globalThis) {
      throw new Error('probe');
    }

    const { data } = await api.post<SigninResponse>(
      API_ENDPOINTS.AUTH.SIGNIN,
      dto,
    );
    return data;
  }
}

export const authService = new AuthService();
