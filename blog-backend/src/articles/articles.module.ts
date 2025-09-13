// src/articles/articles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { Comment } from '../comments/comment.entity';
import { ArticleStats } from './article-stats.entity';
import { AdminArticlesController } from './admin-articles.controller';
import { ArticleReaction } from './article-reaction.entity';
import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Comment, ArticleStats, ArticleReaction, Category, User])],
  providers: [ArticlesService],
  controllers: [ArticlesController, AdminArticlesController],
})
export class ArticlesModule {}
