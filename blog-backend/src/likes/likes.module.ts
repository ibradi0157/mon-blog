import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { Article } from '../articles/article.entity';
import { User } from '../users/user.entity';
import { ArticleStats } from '../articles/article-stats.entity';
import { Comment } from '../comments/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Article, User, ArticleStats, Comment])],
  providers: [LikesService],
  controllers: [LikesController],
})
export class LikesModule {}