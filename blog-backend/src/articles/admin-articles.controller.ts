// src/articles/admin-articles.controller.ts
import { Controller, Get, Param, Query, UseGuards, UsePipes, ValidationPipe, ParseUUIDPipe, Request } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListAdminArticlesDto } from './dto/list-admin-articles.dto';

@ApiTags('admin-articles')
@Controller('admin/articles')
export class AdminArticlesController {
  constructor(private service: ArticlesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  @ApiBearerAuth('bearer')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  list(@Query() q: ListAdminArticlesDto, @Request() req) {
    return this.service.findAllAdminWithPermissions(req.user, q);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  @ApiBearerAuth('bearer')
  getOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Request() req) {
    return this.service.findOneAdminWithPermissions(req.user, id);
  }
}
