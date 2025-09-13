import { Body, Controller, Get, Param, Put, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RoleName } from '../roles/roles.constants.js';
import { LegalService, LegalSlug } from './legal.service.js';
import { UpdateLegalDto } from './dto/update-legal.dto.js';
import { SetPublishedDto } from './dto/set-published.dto.js';
import { Patch } from '@nestjs/common';

@ApiTags('admin-legal')
@Controller('admin/legal')
export class AdminLegalController {
  constructor(private readonly service: LegalService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @ApiBearerAuth('bearer')
  list() {
    return this.service.getAll();
  }

  @Get(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @ApiBearerAuth('bearer')
  getOne(@Param('slug') slug: string) {
    const normalized = slug as LegalSlug;
    return this.service.getBySlug(normalized);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @ApiBearerAuth('bearer')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(@Param('slug') slug: string, @Body() dto: UpdateLegalDto, @Request() _req: any) {
    const normalized = slug as LegalSlug;
    return this.service.upsert(normalized, { title: dto.title, content: dto.content });
  }

  @Patch(':slug/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @ApiBearerAuth('bearer')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  setPublished(@Param('slug') slug: string, @Body() dto: SetPublishedDto) {
    const normalized = slug as LegalSlug;
    return this.service.setPublished(normalized, dto.published);
  }
}
