import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AccessModule } from './access/access.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SitesModule } from './sites/sites.module';
import { FinanceModule } from './finance/finance.module';
import { ContactsModule } from './contacts/contacts.module';
import { ProgressModule } from './progress/progress.module';
import { ScheduleModule } from './schedule/schedule.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityModule } from './activity/activity.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { CategoriesModule } from './categories/categories.module';
import { MailModule } from './mail/mail.module';
import { ClientsModule } from './clients/clients.module';
import { VendorsModule } from './vendors/vendors.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { DevicesModule } from './devices/devices.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.AUTH_RATE_LIMIT_TTL_MS || 60000),
        limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 100),
      },
    ]),
    PrismaModule,
    MailModule,
    AccessModule,
    StorageModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ClientsModule,
    VendorsModule,
    SitesModule,
    FinanceModule,
    ContactsModule,
    ProgressModule,
    ScheduleModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
    ActivityModule,
    CategoriesModule,
    DevicesModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
