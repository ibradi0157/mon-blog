// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Role } from '../roles/role.entity.js';
import { Article } from '../articles/article.entity.js';
import { Comment } from '../comments/comment.entity.js';
import { DeletedEmail } from './deleted-email.entity';
import { EmailValidatorService } from './email-validator.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Article, Comment, DeletedEmail])],
  providers: [UsersService, EmailValidatorService],
  controllers: [UsersController],
  exports: [EmailValidatorService]
})
export class UsersModule {}
