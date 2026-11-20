import { Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types';
import { AccessService } from '../access/access.service';
import { getPagination, paginatedResult } from '../common/utils/pagination';

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
  ) {}

  async log(params: {
    organizationId: string;
    actorId?: string;
    siteId?: string;
    type: ActivityType;
    summary: string;
    metadata?: Prisma.InputJsonValue;
    notifyUserIds?: string[];
  }) {
    const activity = await this.prisma.activityLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.actorId,
        siteId: params.siteId,
        type: params.type,
        summary: params.summary,
        metadata: params.metadata,
      },
    });

    if (params.notifyUserIds?.length) {
      await this.prisma.notification.createMany({
        data: params.notifyUserIds.map((userId) => ({
          organizationId: params.organizationId,
          userId,
          siteId: params.siteId,
          title: params.summary,
          body: params.summary,
          data: { activityId: activity.id, type: params.type },
        })),
      });
    }

    return activity;
  }

  async list(user: AuthUser, query: { page?: number; pageSize?: number; siteId?: string }) {
    const { page, pageSize, skip, take } = getPagination(query);
    const whereBase = await this.access.siteWhereFilter(user, query.siteId);
    const where: Prisma.ActivityLogWhereInput = {
      organizationId: user.organizationId,
      ...(whereBase.siteId
        ? { OR: [{ siteId: whereBase.siteId as string | { in: string[] } }, { siteId: null }] }
        : {}),
    };

    // Fix filter for site access
    const accessible = await this.access.getAccessibleSiteIds(user);
    const siteFilter =
      query.siteId
        ? { siteId: query.siteId }
        : accessible === 'ALL'
          ? {}
          : { OR: [{ siteId: { in: accessible } }, { siteId: null }] };

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { organizationId: user.organizationId, ...siteFilter },
        include: {
          actor: { select: { id: true, fullName: true, email: true } },
          site: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.activityLog.count({
        where: { organizationId: user.organizationId, ...siteFilter },
      }),
    ]);

    return paginatedResult(items, total, page, pageSize);
  }

  async audit(
    params: {
      organizationId: string;
      actorId?: string;
      entityType: string;
      entityId: string;
      action: string;
      before?: Prisma.InputJsonValue;
      after?: Prisma.InputJsonValue;
      reason?: string;
      ipAddress?: string;
    },
  ) {
    return this.prisma.auditLog.create({ data: params });
  }

  async listAudit(
    user: AuthUser,
    query: { page?: number; pageSize?: number; entityType?: string; entityId?: string },
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where: Prisma.AuditLogWhereInput = {
      organizationId: user.organizationId,
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginatedResult(items, total, page, pageSize);
  }
}
