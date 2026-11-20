import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuthUser } from '../auth/types';
import { getPagination, paginatedResult } from '../common/utils/pagination';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendors.dto';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
  ) {}

  async create(user: AuthUser, dto: CreateVendorDto) {
    this.access.assertNotViewerWrite(user);
    return this.prisma.vendor.create({
      data: {
        organizationId: user.organizationId,
        name: dto.name.trim(),
        phone: dto.phone || null,
        email: dto.email || null,
        address: dto.address || null,
      },
    });
  }

  async list(
    user: AuthUser,
    query: { page?: number; pageSize?: number; search?: string },
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where: Prisma.VendorWhereInput = {
      organizationId: user.organizationId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.vendor.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      this.prisma.vendor.count({ where }),
    ]);
    return paginatedResult(items, total, page, pageSize);
  }

  async get(user: AuthUser, id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(user: AuthUser, id: string, dto: UpdateVendorDto) {
    this.access.assertNotViewerWrite(user);
    await this.get(user, id);
    return this.prisma.vendor.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone || null } : {}),
        ...(dto.email !== undefined ? { email: dto.email || null } : {}),
        ...(dto.address !== undefined ? { address: dto.address || null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }
}
