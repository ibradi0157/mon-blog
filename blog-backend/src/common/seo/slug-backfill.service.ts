import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../../articles/article.entity';
import { Category } from '../../categories/category.entity';

@Injectable()
export class SlugBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SlugBackfillService.name);

  constructor(
    @InjectRepository(Article) private readonly articleRepo: Repository<Article>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.backfillCategories();
      await this.backfillArticles();
    } catch (error) {
      this.logger.error('Slug backfill failed', error as any);
    }
  }

  private async backfillCategories() {
    const categories = await this.categoryRepo.find();
    const existingSlugs = new Set<string>(
      categories.map(c => (c.slug || '').trim()).filter(Boolean)
    );

    let updates = 0;
    for (const cat of categories) {
      let changed = false;

      if (!cat.slug) {
        const base = this.slugify(cat.name);
        cat.slug = await this.ensureUniqueSlug(base, existingSlugs);
        existingSlugs.add(cat.slug);
        changed = true;
      }

      if (changed) {
        await this.categoryRepo.save(cat);
        updates++;
      }
    }

    if (updates > 0) this.logger.log(`Backfilled ${updates} category slugs`);
  }

  private async backfillArticles() {
    const articles = await this.articleRepo.find();
    const existingSlugs = new Set<string>(
      articles.map(a => (a.slug || '').trim()).filter(Boolean)
    );

    let updates = 0;
    for (const art of articles) {
      let changed = false;

      if (!art.slug) {
        const base = this.slugify(art.title);
        art.slug = await this.ensureUniqueSlug(base, existingSlugs);
        existingSlugs.add(art.slug);
        changed = true;
      }

      if (!art.excerpt && art.content) {
        art.excerpt = this.generateExcerpt(art.content);
        changed = true;
      }

      if (art.isPublished && !art.publishedAt) {
        art.publishedAt = art.createdAt || new Date();
        changed = true;
      }

      if (changed) {
        await this.articleRepo.save(art);
        updates++;
      }
    }

    if (updates > 0) this.logger.log(`Backfilled ${updates} articles (slug/excerpt/publishedAt)`);
  }

  private async ensureUniqueSlug(base: string, existing: Set<string>): Promise<string> {
    if (!existing.has(base)) return base;
    let i = 2;
    while (existing.has(`${base}-${i}`)) {
      i++;
    }
    return `${base}-${i}`;
  }

  private slugify(text: string): string {
    return (text || '')
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 120);
  }

  private generateExcerpt(content: string, maxLength: number = 160): string {
    const plainText = (content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length <= maxLength) return plainText;
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
}
