import { Module } from '@nestjs/common';
import { FinanceCalcService } from './finance-calc.service';
import { IncomeService } from './income.service';
import { ExpenseService } from './expense.service';
import { IncomeController } from './income.controller';
import { ExpenseController } from './expense.controller';

@Module({
  providers: [FinanceCalcService, IncomeService, ExpenseService],
  controllers: [IncomeController, ExpenseController],
  exports: [FinanceCalcService, IncomeService, ExpenseService],
})
export class FinanceModule {}
