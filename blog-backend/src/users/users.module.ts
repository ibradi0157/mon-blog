// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Role } from '../roles/role.entity.js';
import { Article } from '../articles/article.entity.js';
import { Comment } from '../comments/comment.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Article, Comment])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
