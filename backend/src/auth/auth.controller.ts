import { Body, Controller, Post } from '@nestjs/common';

import { CreateUserDto } from '@src/users/dto';
import { AuthService } from './auth.service';
import { IAuthResponse } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<IAuthResponse> {
    return await this.authService.register(dto);
  }
}
