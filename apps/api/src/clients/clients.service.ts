import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuthUser } from '../auth/types';
import { getPagination, paginatedResult } from '../common/utils/pagination';
import { CreateClientDto, UpdateClientDto } from './dto/clients.dto';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
  ) {}

  async create(user: AuthUser, dto: CreateClientDto) {
    this.access.assertNotViewerWrite(user);
    if (dto.siteId) await this.access.assertSiteAccess(user, dto.siteId);
    return this.prisma.client.create({
      data: {
        organizationId: user.organizationId,
        siteId: dto.siteId || null,
        name: dto.name.trim(),
        phone: dto.phone || null,
        email: dto.email || null,
        address: dto.address || null,
      },
    });
  }

  async list(
    user: AuthUser,
    query: { page?: number; pageSize?: number; search?: string; siteId?: string },
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    if (query.siteId) await this.access.assertSiteAccess(user, query.siteId);
    const accessible = await this.access.getAccessibleSiteIds(user);
    const where: Prisma.ClientWhereInput = {
      organizationId: user.organizationId,
      ...(query.siteId ? { siteId: query.siteId } : {}),
      ...(accessible !== 'ALL' && !query.siteId
        ? { OR: [{ siteId: null }, { siteId: { in: accessible } }] }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.client.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      this.prisma.client.count({ where }),
    ]);
    return paginatedResult(items, total, page, pageSize);
  }

  async get(user: AuthUser, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!client) throw new NotFoundException('Client not found');
    if (client.siteId) await this.access.assertSiteAccess(user, client.siteId);
    return client;
  }

  async update(user: AuthUser, id: string, dto: UpdateClientDto) {
    this.access.assertNotViewerWrite(user);
    await this.get(user, id);
    if (dto.siteId) await this.access.assertSiteAccess(user, dto.siteId);
    return this.prisma.client.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone || null } : {}),
        ...(dto.email !== undefined ? { email: dto.email || null } : {}),
        ...(dto.address !== undefined ? { address: dto.address || null } : {}),
        ...(dto.siteId !== undefined ? { siteId: dto.siteId || null } : {}),
      },
    });
  }
}
