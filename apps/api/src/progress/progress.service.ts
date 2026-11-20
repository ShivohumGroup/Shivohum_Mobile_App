import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, AttachmentKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { ActivityService } from '../activity/activity.service';
import { StorageService } from '../storage/storage.service';
import { AuthUser } from '../auth/types';
import { getPagination, paginatedResult } from '../common/utils/pagination';
import { CreateProgressDto, UpdateProgressDto } from './dto/progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private activity: ActivityService,
    private storage: StorageService,
  ) {}

  async create(user: AuthUser, dto: CreateProgressDto) {
    this.access.assertNotViewerWrite(user);
    await this.access.assertSiteAccess(user, dto.siteId);
    if (
      dto.completionPercent !== undefined &&
      dto.completionPercent !== null &&
      (dto.completionPercent < 0 || dto.completionPercent > 100)
    ) {
      throw new BadRequestException('Completion percent must be between 0 and 100');
    }

    const update = await this.prisma.progressUpdate.create({
      data: {
        organizationId: user.organizationId,
        siteId: dto.siteId,
        updateDate: new Date(dto.updateDate),
        title: dto.title,
        description: dto.description,
        workCategory: dto.workCategory,
        completedWork: dto.completedWork,
        workInProgress: dto.workInProgress,
        blockers: dto.blockers,
        nextDayPlan: dto.nextDayPlan,
        completionPercent: dto.completionPercent ?? null,
        createdById: user.id,
        ...(dto.photoAttachmentIds?.length
          ? {
              photos: {
                create: dto.photoAttachmentIds.map((attachmentId, index) => ({
                  attachmentId,
                  sortOrder: index,
                })),
              },
            }
          : {}),
      },
      include: this.include(),
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId: dto.siteId,
      type: ActivityType.PROGRESS_POSTED,
      summary: `Progress update: ${dto.title}`,
    });

    return update;
  }

  async list(
    user: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      siteId?: string;
      search?: string;
      category?: string;
      from?: string;
      to?: string;
    },
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    const base = await this.access.siteWhereFilter(user, query.siteId);
    const where: Prisma.ProgressUpdateWhereInput = {
      ...base,
      ...(query.category ? { workCategory: query.category } : {}),
      ...(query.from || query.to
        ? {
            updateDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.progressUpdate.findMany({
        where,
        include: this.include(),
        orderBy: [{ updateDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.progressUpdate.count({ where }),
    ]);

    return paginatedResult(items, total, page, pageSize);
  }

  async get(user: AuthUser, id: string) {
    const update = await this.prisma.progressUpdate.findFirst({
      where: { id, organizationId: user.organizationId },
      include: this.include(),
    });
    if (!update) throw new NotFoundException('Progress update not found');
    await this.access.assertSiteAccess(user, update.siteId);
    return update;
  }

  async update(user: AuthUser, id: string, dto: UpdateProgressDto) {
    this.access.assertNotViewerWrite(user);
    const existing = await this.get(user, id);
    if (
      dto.completionPercent !== undefined &&
      dto.completionPercent !== null &&
      (dto.completionPercent < 0 || dto.completionPercent > 100)
    ) {
      throw new BadRequestException('Completion percent must be between 0 and 100');
    }

    const updated = await this.prisma.progressUpdate.update({
      where: { id },
      data: {
        previousSnapshot: existing as never,
        editedAt: new Date(),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.workCategory !== undefined ? { workCategory: dto.workCategory } : {}),
        ...(dto.completedWork !== undefined ? { completedWork: dto.completedWork } : {}),
        ...(dto.workInProgress !== undefined ? { workInProgress: dto.workInProgress } : {}),
        ...(dto.blockers !== undefined ? { blockers: dto.blockers } : {}),
        ...(dto.nextDayPlan !== undefined ? { nextDayPlan: dto.nextDayPlan } : {}),
        ...(dto.completionPercent !== undefined
          ? { completionPercent: dto.completionPercent }
          : {}),
        ...(dto.updateDate !== undefined ? { updateDate: new Date(dto.updateDate) } : {}),
      },
      include: this.include(),
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId: existing.siteId,
      type: ActivityType.PROGRESS_UPDATED,
      summary: `Progress update edited: ${updated.title}`,
    });

    return updated;
  }

  async remove(user: AuthUser, id: string) {
    this.access.assertNotViewerWrite(user);
    const existing = await this.get(user, id);
    await this.prisma.progressPhoto.deleteMany({ where: { progressUpdateId: id } });
    await this.prisma.progressUpdate.delete({ where: { id } });
    return { success: true, siteId: existing.siteId };
  }

  async addPhoto(
    user: AuthUser,
    progressId: string,
    file: Express.Multer.File,
    caption?: string,
  ) {
    this.access.assertNotViewerWrite(user);
    const existing = await this.get(user, progressId);
    const attachment = await this.storage.upload(user, file, {
      siteId: existing.siteId,
      kind: AttachmentKind.PHOTO,
    });

    const count = await this.prisma.progressPhoto.count({
      where: { progressUpdateId: progressId },
    });

    const photo = await this.prisma.progressPhoto.create({
      data: {
        progressUpdateId: progressId,
        attachmentId: attachment.id,
        caption: caption || undefined,
        sortOrder: count,
      },
      include: {
        attachment: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            storageKey: true,
            sizeBytes: true,
          },
        },
      },
    });

    return {
      ...photo,
      url: this.storage.publicUrl(attachment.storageKey),
    };
  }

  private include() {
    return {
      site: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, fullName: true } },
      photos: {
        include: {
          attachment: {
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              storageKey: true,
              sizeBytes: true,
            },
          },
        },
        orderBy: { sortOrder: 'asc' as const },
      },
    };
  }
}
