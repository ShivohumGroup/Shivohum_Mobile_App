import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AccessService } from './access.service';
import { AuthUser } from '../auth/types';

function user(partial: Partial<AuthUser> & Pick<AuthUser, 'role' | 'organizationId'>): AuthUser {
  return {
    id: partial.id || 'user-1',
    email: partial.email || 'u@x.com',
    fullName: partial.fullName || 'User',
    role: partial.role,
    organizationId: partial.organizationId,
    isActive: true,
  };
}

describe('AccessService IDOR / cross-org guards', () => {
  it('denies site access when membership missing', async () => {
    const prisma = {
      site: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'site-a',
          organizationId: 'org-1',
        }),
      },
      siteMembership: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new AccessService(prisma as never);
    await expect(
      service.assertSiteAccess(user({ role: UserRole.SITE_MANAGER, organizationId: 'org-1' }), 'site-a'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns not found for sites outside organization', async () => {
    const prisma = {
      site: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      siteMembership: {
        findFirst: jest.fn(),
      },
    };
    const service = new AccessService(prisma as never);
    await expect(
      service.assertSiteAccess(user({ role: UserRole.ADMIN, organizationId: 'org-1' }), 'foreign-site'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.site.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign-site', organizationId: 'org-1' },
    });
  });

  it('blocks viewer finance writes even with membership', async () => {
    const prisma = {
      site: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'site-a',
          organizationId: 'org-1',
        }),
      },
      siteMembership: {
        findFirst: jest.fn().mockResolvedValue({
          canViewFinance: true,
          canEditFinance: false,
        }),
      },
    };
    const service = new AccessService(prisma as never);
    await expect(
      service.assertSiteAccess(
        user({ role: UserRole.VIEWER, organizationId: 'org-1' }),
        'site-a',
        { requireFinanceWrite: true },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows assigned manager finance write when membership permits', async () => {
    const site = { id: 'site-a', organizationId: 'org-1' };
    const prisma = {
      site: { findFirst: jest.fn().mockResolvedValue(site) },
      siteMembership: {
        findFirst: jest.fn().mockResolvedValue({
          canViewFinance: true,
          canEditFinance: true,
        }),
      },
    };
    const service = new AccessService(prisma as never);
    await expect(
      service.assertSiteAccess(
        user({ role: UserRole.SITE_MANAGER, organizationId: 'org-1' }),
        'site-a',
        { requireFinanceWrite: true },
      ),
    ).resolves.toEqual(site);
  });

  it('scopes getAccessibleSiteIds to memberships for non-admins', async () => {
    const prisma = {
      siteMembership: {
        findMany: jest.fn().mockResolvedValue([{ siteId: 's1' }, { siteId: 's2' }]),
      },
    };
    const service = new AccessService(prisma as never);
    await expect(
      service.getAccessibleSiteIds(
        user({ role: UserRole.PARTNER, organizationId: 'org-1', id: 'partner-1' }),
      ),
    ).resolves.toEqual(['s1', 's2']);
    expect(prisma.siteMembership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'partner-1',
          organizationId: 'org-1',
          isActive: true,
        }),
      }),
    );
  });
});
