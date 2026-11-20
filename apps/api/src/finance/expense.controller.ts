import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/types';
import { CreateExpenseDto, CreateExpensePaymentDto, VoidDto } from './dto/finance.dto';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpenseController {
  constructor(private expenses: ExpenseService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.expenses.create(user, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('siteId') siteId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.expenses.list(user, {
      page,
      pageSize,
      siteId,
      categoryId,
      paymentStatus,
      search,
      from,
      to,
    });
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expenses.get(user, id);
  }

  @Post(':id/payments')
  addPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateExpensePaymentDto,
  ) {
    return this.expenses.addPayment(user, id, dto);
  }

  @Post(':id/void')
  void(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: VoidDto) {
    return this.expenses.void(user, id, dto);
  }
}
