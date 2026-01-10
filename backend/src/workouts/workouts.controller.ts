import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  Logger,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtAuthGuard } from '@src/auth/guards';
import { CurrentUser } from '@src/common/decorators';
import { ResponseMessages } from '@src/common/messages';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto } from './dto';

@Controller('workouts')
export class WorkoutsController {
  private readonly logger = new Logger(WorkoutsController.name);

  constructor(private readonly workoutsService: WorkoutsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() CreateWorkoutDto: CreateWorkoutDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!userId) {
      this.logger.error(ResponseMessages.User.IdNotFound, userId);
      throw new UnauthorizedException(ResponseMessages.User.IdNotFound);
    }
    return await this.workoutsService.create(CreateWorkoutDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    if (!userId) {
      this.logger.error(ResponseMessages.User.IdNotFound, userId);
      throw new UnauthorizedException(ResponseMessages.User.IdNotFound);
    }
    return await this.workoutsService.findAll(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.workoutsService.findOne(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.workoutsService.remove(id, userId);
  }
}
