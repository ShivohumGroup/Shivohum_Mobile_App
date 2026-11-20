import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { SitesService } from './sites.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/types';
import { AssignMemberDto, CreateSiteDto, UpdateSiteDto } from './dto/sites.dto';

@ApiTags('sites')
@ApiBearerAuth()
@Controller('sites')
export class SitesController {
  constructor(private sites: SitesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSiteDto) {
    return this.sites.create(user, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('status') status?: ProjectStatus,
    @Query('projectType') projectType?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.sites.list(user, {
      page,
      pageSize,
      search,
      status,
      projectType,
      includeArchived,
    });
  }

  @Get(':id/summary')
  summary(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sites.summary(user, id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sites.get(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
  ) {
    return this.sites.update(user, id, dto);
  }

  @Post(':id/archive')
  archive(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sites.archive(user, id);
  }

  @Post(':id/members')
  assignMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignMemberDto,
  ) {
    return this.sites.assignMember(user, id, dto);
  }
}
