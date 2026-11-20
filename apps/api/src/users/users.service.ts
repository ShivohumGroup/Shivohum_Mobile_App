import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../auth/types';
import { getPagination, paginatedResult } from '../common/utils/pagination';
import { InviteUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

  async list(user: AuthUser, query: { page?: number; pageSize?: number; search?: string }) {
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as never)) {
      throw new BadRequestException('Insufficient permissions');
    }
    const { page, pageSize, skip, take } = getPagination(query);
    const where = {
      organizationId: user.organizationId,
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          memberships: {
            where: { isActive: true },
            select: { siteId: true, site: { select: { name: true, code: true } } },
          },
        },
        orderBy: { fullName: 'asc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginatedResult(items, total, page, pageSize);
  }

  async invite(user: AuthUser, dto: InviteUserDto) {
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as never)) {
      throw new BadRequestException('Insufficient permissions');
    }
    const email = dto.email.toLowerCase().trim();
    const exists = await this.prisma.user.findFirst({
      where: { organizationId: user.organizationId, email },
    });
    if (exists) throw new BadRequestException('User with this email already exists');

    const tempPassword = dto.password || `Temp@${randomBytes(4).toString('hex')}`;
    const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

    const created = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          organizationId: user.organizationId,
          email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: dto.role,
          isActive: true,
        },
      });

      if (dto.siteIds?.length) {
        await tx.siteMembership.createMany({
          data: dto.siteIds.map((siteId) => ({
            organizationId: user.organizationId,
            siteId,
            userId: newUser.id,
            role: dto.role,
            canViewFinance: dto.role !== UserRole.VIEWER,
            canEditFinance: [UserRole.ADMIN, UserRole.PARTNER, UserRole.SITE_MANAGER].includes(
              dto.role as never,
            ),
            canEditProgress: dto.role !== UserRole.VIEWER,
            canEditContacts: dto.role !== UserRole.VIEWER,
          })),
        });
      }

      return newUser;
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      type: ActivityType.USER_INVITED,
      summary: `User invited: ${dto.fullName}`,
    });

    return {
      id: created.id,
      email: created.email,
      fullName: created.fullName,
      role: created.role,
      ...(process.env.NODE_ENV !== 'production' ? { temporaryPassword: tempPassword } : {}),
    };
  }

  async get(user: AuthUser, id: string) {
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as never)) {
      throw new BadRequestException('Insufficient permissions');
    }
    const target = await this.prisma.user.findFirst({
      where: { id, organizationId: user.organizationId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        memberships: {
          where: { isActive: true },
          select: {
            id: true,
            siteId: true,
            canViewFinance: true,
            canEditFinance: true,
            site: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    if (!target) throw new NotFoundException('User not found');
    return target;
  }

  async setMemberships(user: AuthUser, id: string, siteIds: string[]) {
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as never)) {
      throw new BadRequestException('Insufficient permissions');
    }
    const target = await this.prisma.user.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!target) throw new NotFoundException('User not found');

    const uniqueSiteIds = [...new Set(siteIds)];
    if (uniqueSiteIds.length) {
      const sites = await this.prisma.site.findMany({
        where: {
          organizationId: user.organizationId,
          id: { in: uniqueSiteIds },
          archivedAt: null,
        },
        select: { id: true },
      });
      if (sites.length !== uniqueSiteIds.length) {
        throw new BadRequestException('One or more sites are invalid');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.siteMembership.updateMany({
        where: { userId: id, organizationId: user.organizationId, isActive: true },
        data: { isActive: false },
      });

      for (const siteId of uniqueSiteIds) {
        await tx.siteMembership.upsert({
          where: { siteId_userId: { siteId, userId: id } },
          create: {
            organizationId: user.organizationId,
            siteId,
            userId: id,
            role: target.role,
            isActive: true,
            canViewFinance: target.role !== UserRole.VIEWER,
            canEditFinance: [UserRole.ADMIN, UserRole.PARTNER, UserRole.SITE_MANAGER].includes(
              target.role as never,
            ),
            canEditProgress: target.role !== UserRole.VIEWER,
            canEditContacts: target.role !== UserRole.VIEWER,
          },
          update: {
            isActive: true,
            role: target.role,
            canViewFinance: target.role !== UserRole.VIEWER,
            canEditFinance: [UserRole.ADMIN, UserRole.PARTNER, UserRole.SITE_MANAGER].includes(
              target.role as never,
            ),
            canEditProgress: target.role !== UserRole.VIEWER,
            canEditContacts: target.role !== UserRole.VIEWER,
          },
        });
      }
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      type: ActivityType.MEMBERSHIP_CHANGED,
      summary: `Site access updated for ${target.fullName}`,
      metadata: { userId: id, siteIds: uniqueSiteIds },
    });

    return this.get(user, id);
  }

  async setActive(user: AuthUser, id: string, isActive: boolean) {
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as never)) {
      throw new BadRequestException('Insufficient permissions');
    }
    if (id === user.id) throw new BadRequestException('Cannot deactivate yourself');
    const target = await this.prisma.user.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!target) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
  }
}
