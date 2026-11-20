import { UserRole } from '@prisma/client';
import { AccessService } from './access.service';

describe('AccessService role helpers', () => {
  const service = new AccessService({} as never);

  it('treats SUPER_ADMIN and ADMIN as org-wide', () => {
    expect(service.isOrgWide(UserRole.SUPER_ADMIN)).toBe(true);
    expect(service.isOrgWide(UserRole.ADMIN)).toBe(true);
    expect(service.isOrgWide(UserRole.PARTNER)).toBe(false);
    expect(service.isOrgWide(UserRole.SITE_MANAGER)).toBe(false);
    expect(service.isOrgWide(UserRole.VIEWER)).toBe(false);
  });

  it('blocks viewer writes', () => {
    expect(() =>
      service.assertNotViewerWrite({
        id: '1',
        email: 'v@x.com',
        fullName: 'V',
        role: UserRole.VIEWER,
        organizationId: 'o',
        isActive: true,
      }),
    ).toThrow();
  });
});
