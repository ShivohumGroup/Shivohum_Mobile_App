import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId: string;
  type: 'access' | 'refresh';
  familyId?: string;
}
