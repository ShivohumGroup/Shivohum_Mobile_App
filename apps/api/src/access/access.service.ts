import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types';

@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  isOrgWide(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
  }

  async getAccessibleSiteIds(user: AuthUser): Promise<string[] | 'ALL'> {
    if (this.isOrgWide(user.role)) return 'ALL';

    const memberships = await this.prisma.siteMembership.findMany({
      where: {
        userId: user.id,
        organizationId: user.organizationId,
        isActive: true,
        site: { archivedAt: null },
      },
      select: { siteId: true },
    });
    return memberships.map((m) => m.siteId);
  }

  async assertSiteAccess(
    user: AuthUser,
    siteId: string,
    options?: { requireFinanceWrite?: boolean; requireFinanceRead?: boolean },
  ) {
    const site = await this.prisma.site.findFirst({
      where: { id: siteId, organizationId: user.organizationId },
    });
    if (!site) throw new NotFoundException('Site not found');

    if (this.isOrgWide(user.role)) return site;

    const membership = await this.prisma.siteMembership.findFirst({
      where: {
        siteId,
        userId: user.id,
        organizationId: user.organizationId,
        isActive: true,
      },
    });
    if (!membership) {
      throw new ForbiddenException('You do not have access to this site');
    }

    if (options?.requireFinanceRead && !membership.canViewFinance && user.role !== UserRole.PARTNER) {
      // PARTNER always can view finance for assigned sites by product rules
      if (user.role === UserRole.VIEWER && !membership.canViewFinance) {
        throw new ForbiddenException('Finance view not permitted');
      }
    }

    if (options?.requireFinanceWrite) {
      const canWrite =
        membership.canEditFinance ||
        user.role === UserRole.SITE_MANAGER ||
        user.role === UserRole.PARTNER ||
        user.role === UserRole.ADMIN ||
        user.role === UserRole.SUPER_ADMIN;
      if (!canWrite || user.role === UserRole.VIEWER) {
        throw new ForbiddenException('Finance write not permitted');
      }
    }

    if (user.role === UserRole.VIEWER && options?.requireFinanceWrite) {
      throw new ForbiddenException('Read-only access');
    }

    return site;
  }

  async siteWhereFilter(user: AuthUser, siteId?: string) {
    const accessible = await this.getAccessibleSiteIds(user);
    if (siteId) {
      await this.assertSiteAccess(user, siteId);
      return { siteId, organizationId: user.organizationId };
    }
    if (accessible === 'ALL') {
      return { organizationId: user.organizationId };
    }
    return {
      organizationId: user.organizationId,
      siteId: { in: accessible.length ? accessible : ['00000000-0000-0000-0000-000000000000'] },
    };
  }

  assertNotViewerWrite(user: AuthUser) {
    if (user.role === UserRole.VIEWER) {
      throw new ForbiddenException('Viewers have read-only access');
    }
  }
}
