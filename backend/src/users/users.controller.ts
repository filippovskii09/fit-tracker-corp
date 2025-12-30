import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { ResponseMessages } from '@src/common/messages';
import { JwtAuthGuard } from '@src/auth/guards';
import { CurrentUser } from '@src/common/decorators';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<string> {
    await this.usersService.create(dto);
    return ResponseMessages.User.SuccessRegistration;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }
}
