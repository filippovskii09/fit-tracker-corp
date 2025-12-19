import { Body, Controller, Post } from '@nestjs/common';

import { ResponseMessages } from '@src/common/messages';
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
}
