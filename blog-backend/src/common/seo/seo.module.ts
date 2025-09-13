import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../../articles/article.entity';
import { Category } from '../../categories/category.entity';
import { SlugBackfillService } from './slug-backfill.service';
import { SEOService } from './seo.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Category])],
  providers: [SlugBackfillService, SEOService],
  exports: [SEOService],
})
export class SeoModule {}
