import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IncomeService } from './income.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/types';
import { CreateIncomeDto, VoidDto } from './dto/finance.dto';

@ApiTags('income')
@ApiBearerAuth()
@Controller('income')
export class IncomeController {
  constructor(private income: IncomeService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateIncomeDto) {
    return this.income.create(user, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('siteId') siteId?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.income.list(user, { page, pageSize, siteId, search, from, to });
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.income.get(user, id);
  }

  @Post(':id/void')
  void(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: VoidDto) {
    return this.income.void(user, id, dto);
  }
}
