import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types';
import { RegisterDeviceDto } from './dto/devices.dto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async register(user: AuthUser, dto: RegisterDeviceDto) {
    return this.prisma.devicePushToken.upsert({
      where: {
        userId_token: { userId: user.id, token: dto.token },
      },
      create: {
        organizationId: user.organizationId,
        userId: user.id,
        token: dto.token,
        platform: dto.platform,
        isActive: true,
      },
      update: {
        platform: dto.platform,
        isActive: true,
        organizationId: user.organizationId,
      },
    });
  }

  async unregister(user: AuthUser, token: string) {
    await this.prisma.devicePushToken.updateMany({
      where: { userId: user.id, token },
      data: { isActive: false },
    });
    return { success: true };
  }

  async listMine(user: AuthUser) {
    return this.prisma.devicePushToken.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
