import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types';
import { UpdateOrganizationDto } from './dto/organizations.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async getMine(user: AuthUser) {
    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateMine(user: AuthUser, dto: UpdateOrganizationDto) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update organization settings');
    }
    await this.getMine(user);
    return this.prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.isActive !== undefined && user.role === UserRole.SUPER_ADMIN
          ? { isActive: dto.isActive }
          : {}),
      },
    });
  }
}
