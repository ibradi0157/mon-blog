// src/articles/articles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { SeoModule } from '../common/seo/seo.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Comment } from '../comments/comment.entity';
import { ArticleStats } from './article-stats.entity';
import { AdminArticlesController } from './admin-articles.controller';
import { ArticleReaction } from './article-reaction.entity';
import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';
import { ArticleHistoryTitle } from './article-history-title.entity';
import { ArticleTitleValidatorService } from './article-title-validator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      Comment,
      ArticleStats,
      ArticleReaction,
      Category,
      User,
      ArticleHistoryTitle
    ]),
    SeoModule,
    SubscriptionsModule,
  ],
  providers: [
    ArticlesService,
    ArticleTitleValidatorService
  ],
  controllers: [ArticlesController, AdminArticlesController],
  exports: [ArticleTitleValidatorService]
})
export class ArticlesModule {}
