import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../auth/types';
import { getPagination, paginatedResult } from '../common/utils/pagination';
import { CreateContactDto, UpdateContactDto } from './dto/contacts.dto';

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private activity: ActivityService,
  ) {}

  async create(user: AuthUser, dto: CreateContactDto) {
    this.access.assertNotViewerWrite(user);
    for (const siteId of dto.siteIds) {
      await this.access.assertSiteAccess(user, siteId);
    }

    const contact = await this.prisma.contact.create({
      data: {
        organizationId: user.organizationId,
        personName: dto.personName,
        companyName: dto.companyName,
        workCategory: dto.workCategory,
        designation: dto.designation,
        primaryPhone: dto.primaryPhone,
        alternatePhone: dto.alternatePhone,
        whatsappNumber: dto.whatsappNumber,
        email: dto.email || null,
        address: dto.address,
        notes: dto.notes,
        createdById: user.id,
        sites: {
          create: dto.siteIds.map((siteId) => ({ siteId })),
        },
      },
      include: {
        sites: { include: { site: { select: { id: true, name: true, code: true } } } },
      },
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId: dto.siteIds[0],
      type: ActivityType.CONTACT_ADDED,
      summary: `Contact added: ${dto.personName}`,
    });

    return this.serialize(contact);
  }

  async list(
    user: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      search?: string;
      siteId?: string;
      category?: string;
      active?: string;
    },
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    const accessible = await this.access.getAccessibleSiteIds(user);

    if (query.siteId) await this.access.assertSiteAccess(user, query.siteId);

    const siteFilter =
      query.siteId
        ? { some: { siteId: query.siteId } }
        : accessible === 'ALL'
          ? undefined
          : { some: { siteId: { in: accessible } } };

    const where: Prisma.ContactWhereInput = {
      organizationId: user.organizationId,
      ...(siteFilter ? { sites: siteFilter } : {}),
      ...(query.category ? { workCategory: query.category } : {}),
      ...(query.active === 'false' ? { isActive: false } : { isActive: true }),
      ...(query.search
        ? {
            OR: [
              { personName: { contains: query.search, mode: 'insensitive' } },
              { companyName: { contains: query.search, mode: 'insensitive' } },
              { primaryPhone: { contains: query.search } },
              { workCategory: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: {
          sites: { include: { site: { select: { id: true, name: true, code: true } } } },
        },
        orderBy: { personName: 'asc' },
        skip,
        take,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return paginatedResult(items.map((c) => this.serialize(c)), total, page, pageSize);
  }

  async get(user: AuthUser, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        sites: { include: { site: { select: { id: true, name: true, code: true } } } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    const accessible = await this.access.getAccessibleSiteIds(user);
    if (accessible !== 'ALL') {
      const allowed = contact.sites.some((s) => accessible.includes(s.siteId));
      if (!allowed) throw new NotFoundException('Contact not found');
    }
    return this.serialize(contact);
  }

  async update(user: AuthUser, id: string, dto: UpdateContactDto) {
    this.access.assertNotViewerWrite(user);
    await this.get(user, id);

    if (dto.siteIds?.length) {
      for (const siteId of dto.siteIds) {
        await this.access.assertSiteAccess(user, siteId);
      }
      await this.prisma.contactSite.deleteMany({ where: { contactId: id } });
      await this.prisma.contactSite.createMany({
        data: dto.siteIds.map((siteId) => ({ contactId: id, siteId })),
      });
    }

    const contact = await this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.personName !== undefined ? { personName: dto.personName } : {}),
        ...(dto.companyName !== undefined ? { companyName: dto.companyName } : {}),
        ...(dto.workCategory !== undefined ? { workCategory: dto.workCategory } : {}),
        ...(dto.designation !== undefined ? { designation: dto.designation } : {}),
        ...(dto.primaryPhone !== undefined ? { primaryPhone: dto.primaryPhone } : {}),
        ...(dto.alternatePhone !== undefined ? { alternatePhone: dto.alternatePhone } : {}),
        ...(dto.whatsappNumber !== undefined ? { whatsappNumber: dto.whatsappNumber } : {}),
        ...(dto.email !== undefined ? { email: dto.email || null } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        sites: { include: { site: { select: { id: true, name: true, code: true } } } },
      },
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      type: ActivityType.CONTACT_UPDATED,
      summary: `Contact updated: ${contact.personName}`,
    });

    return this.serialize(contact);
  }

  private serialize(contact: {
    sites?: Array<{ site: { id: string; name: string; code: string }; siteId: string }>;
    [key: string]: unknown;
  }) {
    return {
      ...contact,
      sites: contact.sites?.map((s) => s.site) || [],
    };
  }
}
