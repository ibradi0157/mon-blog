// src/articles/admin-article-stats.controller.ts
import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';
import { AdminArticlesStatsBulkDto } from './dto/admin-articles-stats-bulk.dto';
import { ArticleStatsService } from './article-stats.service';

@ApiTags('admin-article-stats')
@Controller('admin/articles/stats')
export class AdminArticleStatsController {
  constructor(private readonly service: ArticleStatsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  @ApiBearerAuth('bearer')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  list(@Query() q: AdminArticlesStatsBulkDto) {
    return this.service.getStatsBulk(q.ids);
  }
}
