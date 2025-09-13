import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomepageConfig } from './homepage.entity';
import { AdminHomepageController } from './admin-homepage.controller';
import { PublicHomepageController } from './public-homepage.controller';
import { HomepageService } from './homepage.service';
import { Article } from '../articles/article.entity';
import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HomepageConfig, Article, Category, User])],
  providers: [HomepageService],
  controllers: [AdminHomepageController, PublicHomepageController],
  exports: [HomepageService],
})
export class HomepageModule {}
