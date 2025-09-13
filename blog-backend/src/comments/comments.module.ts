import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './comment.entity';
import { Article } from '../articles/article.entity';
import { User } from '../users/user.entity';
import { ArticleStats } from '../articles/article-stats.entity';
import { CommentReport } from './comment-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Article, User, ArticleStats, CommentReport])],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}