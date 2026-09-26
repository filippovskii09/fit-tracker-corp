import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@src/auth/guards';
import { CurrentUser } from '@src/common/decorators';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }
}
