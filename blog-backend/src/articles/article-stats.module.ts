import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleStats } from './article-stats.entity';
import { Article } from './article.entity';
import { Comment } from '../comments/comment.entity';
import { ArticleStatsService } from './article-stats.service';
import { ArticleStatsController } from './article-stats.controller';
import { AdminArticleStatsController } from './admin-article-stats.controller';
import { ArticleReaction } from './article-reaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleStats, Article, Comment, ArticleReaction])],
  providers: [ArticleStatsService],
  controllers: [ArticleStatsController, AdminArticleStatsController],
})
export class ArticleStatsModule {}