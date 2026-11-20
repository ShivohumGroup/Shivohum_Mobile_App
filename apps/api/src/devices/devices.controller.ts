import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/types';
import { RegisterDeviceDto } from './dto/devices.dto';

@ApiTags('devices')
@ApiBearerAuth()
@Controller('devices')
export class DevicesController {
  constructor(private devices: DevicesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.devices.listMine(user);
  }

  @Post('push-token')
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    return this.devices.register(user, dto);
  }

  @Delete('push-token')
  unregister(@CurrentUser() user: AuthUser, @Query('token') token: string) {
    return this.devices.unregister(user, token);
  }
}
