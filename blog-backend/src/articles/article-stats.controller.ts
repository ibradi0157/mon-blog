import { Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { ArticleStatsService } from './article-stats.service';
import { JwtAuthGuard, JwtOptionalAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('article-stats')
@Controller('articles/:articleId/stats')
export class ArticleStatsController {
  constructor(private readonly service: ArticleStatsService) {}

  @Get()
  getStats(@Param('articleId') articleId: string) {
    return this.service.getStats(articleId);
  }

  @Post('view')
  @UseGuards(JwtOptionalAuthGuard)
  incrementViews(@Param('articleId') articleId: string, @Request() req) {
    return this.service.incrementViews(articleId, req, req.user);
  }

  @Post('like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  like(@Param('articleId') articleId: string, @Request() req) {
    return this.service.incrementLikes(articleId, req.user);
  }

  @Post('dislike')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  dislike(@Param('articleId') articleId: string, @Request() req) {
    return this.service.incrementDislikes(articleId, req.user);
  }
}