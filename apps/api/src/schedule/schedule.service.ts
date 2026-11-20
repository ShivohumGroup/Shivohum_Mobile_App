import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma, ScheduleTaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../auth/types';
import { getPagination, paginatedResult } from '../common/utils/pagination';
import { CreateScheduleTaskDto, UpdateScheduleTaskDto } from './dto/schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private activity: ActivityService,
  ) {}

  async create(user: AuthUser, dto: CreateScheduleTaskDto) {
    this.access.assertNotViewerWrite(user);
    if (dto.siteId) {
      await this.access.assertSiteAccess(user, dto.siteId);
    }

    const task = await this.prisma.scheduleTask.create({
      data: {
        organizationId: user.organizationId,
        siteId: dto.siteId || null,
        title: dto.title.trim(),
        notes: dto.notes?.trim() || null,
        category: dto.category?.trim() || null,
        scheduledDate: new Date(dto.scheduledDate),
        status: dto.status || ScheduleTaskStatus.PLANNED,
        assigneeId: dto.assigneeId || null,
        createdById: user.id,
        completedAt: dto.status === ScheduleTaskStatus.DONE ? new Date() : null,
      },
      include: this.include(),
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId: dto.siteId || undefined,
      type: ActivityType.SCHEDULE_CREATED,
      summary: `Scheduled: ${dto.title}`,
    });

    return task;
  }

  async list(
    user: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      siteId?: string;
      status?: ScheduleTaskStatus;
      search?: string;
      from?: string;
      to?: string;
    },
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    const accessible = await this.access.getAccessibleSiteIds(user);

    if (query.siteId) {
      await this.access.assertSiteAccess(user, query.siteId);
    }

    const siteFilter: Prisma.ScheduleTaskWhereInput =
      query.siteId
        ? { siteId: query.siteId }
        : accessible === 'ALL'
          ? {}
          : {
              OR: [
                { siteId: null },
                { siteId: { in: accessible.length ? accessible : ['00000000-0000-0000-0000-000000000000'] } },
              ],
            };

    const where: Prisma.ScheduleTaskWhereInput = {
      organizationId: user.organizationId,
      ...siteFilter,
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            scheduledDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { notes: { contains: query.search, mode: 'insensitive' } },
              { category: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.scheduleTask.findMany({
        where,
        include: this.include(),
        orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.scheduleTask.count({ where }),
    ]);

    return paginatedResult(items, total, page, pageSize);
  }

  async get(user: AuthUser, id: string) {
    const task = await this.prisma.scheduleTask.findFirst({
      where: { id, organizationId: user.organizationId },
      include: this.include(),
    });
    if (!task) throw new NotFoundException('Schedule task not found');
    if (task.siteId) {
      await this.access.assertSiteAccess(user, task.siteId);
    }
    return task;
  }

  async update(user: AuthUser, id: string, dto: UpdateScheduleTaskDto) {
    this.access.assertNotViewerWrite(user);
    const existing = await this.get(user, id);

    if (dto.siteId) {
      await this.access.assertSiteAccess(user, dto.siteId);
    }

    const nextStatus = dto.status ?? existing.status;
    const completedAt =
      nextStatus === ScheduleTaskStatus.DONE
        ? existing.completedAt || new Date()
        : nextStatus === ScheduleTaskStatus.CANCELLED
          ? existing.completedAt
          : null;

    const task = await this.prisma.scheduleTask.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
        ...(dto.category !== undefined ? { category: dto.category?.trim() || null } : {}),
        ...(dto.scheduledDate !== undefined ? { scheduledDate: new Date(dto.scheduledDate) } : {}),
        ...(dto.siteId !== undefined ? { siteId: dto.siteId || null } : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status, completedAt } : {}),
      },
      include: this.include(),
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId: task.siteId || undefined,
      type: ActivityType.SCHEDULE_UPDATED,
      summary: `Schedule updated: ${task.title} → ${task.status}`,
    });

    return task;
  }

  async remove(user: AuthUser, id: string) {
    this.access.assertNotViewerWrite(user);
    await this.get(user, id);
    await this.prisma.scheduleTask.delete({ where: { id } });
    return { success: true };
  }

  private include() {
    return {
      site: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, fullName: true } },
      assignee: { select: { id: true, fullName: true } },
    } as const;
  }
}
