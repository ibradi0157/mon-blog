// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PublicUsersController } from './public-users.controller';
import { FollowController } from './follow.controller';
import { Role } from '../roles/role.entity.js';
import { Article } from '../articles/article.entity.js';
import { Comment } from '../comments/comment.entity.js';
import { Subscription } from '../subscriptions/subscription.entity';
import { DeletedEmail } from './deleted-email.entity';
import { EmailValidatorService } from './email-validator.service';
import { ArticleStats } from '../articles/article-stats.entity';
import { UserFollow } from './user-follow.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Article, Comment, Subscription, DeletedEmail, ArticleStats, UserFollow]),
    NotificationsModule,
  ],
  providers: [UsersService, EmailValidatorService],
  controllers: [UsersController, PublicUsersController, FollowController],
  exports: [EmailValidatorService]
})
export class UsersModule {}
