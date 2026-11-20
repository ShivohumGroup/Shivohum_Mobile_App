import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types';
import { getPagination, paginatedResult } from '../common/utils/pagination';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(user: AuthUser, query: { page?: number; pageSize?: number; unreadOnly?: string }) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = {
      userId: user.id,
      organizationId: user.organizationId,
      ...(query.unreadOnly === 'true' ? { isRead: false } : {}),
    };
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: { site: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId: user.id, organizationId: user.organizationId, isRead: false },
      }),
    ]);
    return { ...paginatedResult(items, total, page, pageSize), unreadCount };
  }

  async markRead(user: AuthUser, id: string) {
    const n = await this.prisma.notification.findFirst({
      where: { id, userId: user.id },
    });
    if (!n) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(user: AuthUser) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }
}
