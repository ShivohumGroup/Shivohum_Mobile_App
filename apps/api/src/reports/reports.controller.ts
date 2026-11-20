import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/types';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('site-wise')
  siteWise(@CurrentUser() user: AuthUser, @Query('year') year?: number) {
    return this.reports.siteWise(user, year);
  }

  @Get('monthly-income')
  monthlyIncome(
    @CurrentUser() user: AuthUser,
    @Query('year') year = new Date().getFullYear(),
    @Query('siteId') siteId?: string,
  ) {
    return this.reports.monthlyIncome(user, Number(year), siteId);
  }

  @Get('monthly-expense')
  monthlyExpense(
    @CurrentUser() user: AuthUser,
    @Query('year') year = new Date().getFullYear(),
    @Query('siteId') siteId?: string,
  ) {
    return this.reports.monthlyExpense(user, Number(year), siteId);
  }

  @Get('yearly')
  yearly(
    @CurrentUser() user: AuthUser,
    @Query('year') year = new Date().getFullYear(),
    @Query('siteId') siteId?: string,
  ) {
    return this.reports.yearlySummary(user, Number(year), siteId);
  }

  @Get('ledger')
  ledger(
    @CurrentUser() user: AuthUser,
    @Query('siteId') siteId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.ledger(user, { siteId, from, to });
  }

  @Get('expense-categories')
  expenseCategories(
    @CurrentUser() user: AuthUser,
    @Query('year') year?: number,
    @Query('siteId') siteId?: string,
  ) {
    return this.reports.expenseCategoryReport(user, year ? Number(year) : undefined, siteId);
  }

  @Get('site-comparison')
  siteComparison(@CurrentUser() user: AuthUser, @Query('year') year?: number) {
    return this.reports.siteComparison(user, year ? Number(year) : undefined);
  }

  @Get('profitability')
  profitability(
    @CurrentUser() user: AuthUser,
    @Query('year') year?: number,
    @Query('siteId') siteId?: string,
  ) {
    return this.reports.profitability(user, year ? Number(year) : undefined, siteId);
  }

  @Get('outstanding-clients')
  outstandingClients(@CurrentUser() user: AuthUser) {
    return this.reports.outstandingClients(user);
  }

  @Get('outstanding-vendors')
  outstandingVendors(@CurrentUser() user: AuthUser, @Query('siteId') siteId?: string) {
    return this.reports.outstandingVendors(user, siteId);
  }

  @Get('export/excel')
  async excel(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
    @Query('kind') kind = 'site-wise',
    @Query('year') year?: number,
    @Query('siteId') siteId?: string,
  ) {
    const buffer = await this.reports.exportExcel(user, kind, year ? Number(year) : undefined, siteId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="siteflow-${kind}.xlsx"`);
    res.send(buffer);
  }

  @Get('export/pdf')
  async pdf(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
    @Query('kind') kind = 'site-wise',
    @Query('year') year?: number,
    @Query('siteId') siteId?: string,
  ) {
    const buffer = await this.reports.exportPdf(user, kind, year ? Number(year) : undefined, siteId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="siteflow-${kind}.pdf"`);
    res.send(buffer);
  }
}
