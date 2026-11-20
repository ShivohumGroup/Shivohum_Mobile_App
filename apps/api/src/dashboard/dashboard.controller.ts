import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/types';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('siteId') siteId?: string,
    @Query('status') status?: ProjectStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dashboard.summary(user, { year, month, siteId, status, from, to });
  }
}
