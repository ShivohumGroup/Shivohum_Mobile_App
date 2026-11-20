import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  list(user: AuthUser) {
    return this.prisma.expenseCategory.findMany({
      where: { organizationId: user.organizationId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(user: AuthUser, name: string, description?: string) {
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as never)) {
      throw new BadRequestException('Only admins can manage categories');
    }
    return this.prisma.expenseCategory.create({
      data: {
        organizationId: user.organizationId,
        name: name.trim(),
        description,
      },
    });
  }
}
