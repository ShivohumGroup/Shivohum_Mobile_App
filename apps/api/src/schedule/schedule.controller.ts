import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ScheduleTaskStatus } from '@prisma/client';
import { ScheduleService } from './schedule.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/types';
import { CreateScheduleTaskDto, UpdateScheduleTaskDto } from './dto/schedule.dto';

@ApiTags('schedule')
@ApiBearerAuth()
@Controller('schedule')
export class ScheduleController {
  constructor(private schedule: ScheduleService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateScheduleTaskDto) {
    return this.schedule.create(user, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('siteId') siteId?: string,
    @Query('status') status?: ScheduleTaskStatus,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.schedule.list(user, { page, pageSize, siteId, status, search, from, to });
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schedule.get(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleTaskDto,
  ) {
    return this.schedule.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schedule.remove(user, id);
  }
}
