import { BadRequestException, Injectable } from '@nestjs/common';

import { ResponseMessages } from '@src/common/messages';
import { CreateUserDto } from '@src/users/dto';
import { UsersService } from '@src/users/users.service';
import { IAuthResponse } from './types';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(dto: CreateUserDto): Promise<IAuthResponse> {
    const existUser = await this.usersService.findByEmail(dto.email);
    if (existUser) {
      throw new BadRequestException(ResponseMessages.Auth.ExistUser);
    }

    await this.usersService.create(dto);

    return {
      message: ResponseMessages.User.SuccessRegistration,
    };
  }
}
