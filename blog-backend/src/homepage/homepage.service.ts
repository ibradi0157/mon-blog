import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HomepageConfig } from './homepage.entity';
import { Article } from '../articles/article.entity';
import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';

export type UpdateHomepagePayload = {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  featuredArticleIds?: string[];
  sections?: any | null;
};

@Injectable()
export class HomepageService {
  constructor(
    @InjectRepository(HomepageConfig) private readonly repo: Repository<HomepageConfig>,
    @InjectRepository(Article) private readonly articleRepo: Repository<Article>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private async getSingleton(): Promise<HomepageConfig> {
    let cfg = await this.repo.findOne({ where: {} });
    if (!cfg) {
      cfg = this.repo.create({ featuredArticleIds: [] });
      cfg = await this.repo.save(cfg);
    }
    return cfg;
  }

  async getAdminConfig() {
    const cfg = await this.getSingleton();
    return { success: true, data: cfg };
  }

  async updateConfig(payload: UpdateHomepagePayload) {
    const cfg = await this.getSingleton();
    Object.assign(cfg, {
      heroTitle: payload.heroTitle ?? cfg.heroTitle ?? null,
      heroSubtitle: payload.heroSubtitle ?? cfg.heroSubtitle ?? null,
      heroImageUrl: payload.heroImageUrl ?? cfg.heroImageUrl ?? null,
      sections: payload.sections ?? cfg.sections ?? null,
      featuredArticleIds: payload.featuredArticleIds ?? cfg.featuredArticleIds ?? [],
    });
    const saved = await this.repo.save(cfg);
    return { success: true, data: saved };
  }

  async getPublicConfig() {
    const cfg = await this.getSingleton();

    // Resolve top-level featured articles (back-compat / fallback)
    const ids = cfg.featuredArticleIds ?? [];
    let featured: any[] = [];
    if (ids.length > 0) {
      const rows = await this.articleRepo.find({ where: { id: In(ids), isPublished: true }, order: { createdAt: 'DESC' } });
      const map = new Map(rows.map((r) => [r.id, r] as const));
      const articles = ids.map((id) => map.get(id)).filter(Boolean) as Article[];
      
      // Get authors for featured articles
      const authorIds = Array.from(new Set(articles.map(a => a.authorId).filter(Boolean))) as string[];
      let authorsMap = new Map<string, { id: string; displayName: string; avatarUrl?: string | null }>();
      if (authorIds.length) {
        const authors = await this.userRepo.find({ where: { id: In(authorIds) }, select: ['id', 'displayName', 'avatarUrl'] as any });
        authorsMap = new Map(authors.map((u) => [u.id, { id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl }]));
      }
      
      featured = articles.map(article => ({
        ...article,
        author: article.authorId ? authorsMap.get(article.authorId) || null : null
      }));
    }

    // Resolve section-level content (featured grids and category grids)
    let resolvedSections: any[] | null = null;
    const rawSections = cfg.sections ?? null;
    if (Array.isArray(rawSections) && rawSections.length > 0) {
      // Collect unique article IDs across all featuredGrid sections
      const wantedArticleIds: string[] = [];
      // Collect unique category IDs across all categoryGrid sections
      const wantedCategoryIds: string[] = [];
      for (const s of rawSections) {
        if (s && s.kind === 'featuredGrid' && Array.isArray(s.articleIds)) {
          for (const id of s.articleIds) {
            if (typeof id === 'string' && !wantedArticleIds.includes(id)) wantedArticleIds.push(id);
          }
        }
        if (s && s.kind === 'categoryGrid' && Array.isArray(s.categoryIds)) {
          for (const id of s.categoryIds) {
            if (typeof id === 'string' && !wantedCategoryIds.includes(id)) wantedCategoryIds.push(id);
          }
        }
      }

      let allArticles: any[] = [];
      if (wantedArticleIds.length > 0) {
        const rows = await this.articleRepo.find({ where: { id: In(wantedArticleIds), isPublished: true }, order: { createdAt: 'DESC' } });
        
        // Get authors for section articles
        const authorIds = Array.from(new Set(rows.map(a => a.authorId).filter(Boolean))) as string[];
        let authorsMap = new Map<string, { id: string; displayName: string; avatarUrl?: string | null }>();
        if (authorIds.length) {
          const authors = await this.userRepo.find({ where: { id: In(authorIds) }, select: ['id', 'displayName', 'avatarUrl'] as any });
          authorsMap = new Map(authors.map((u) => [u.id, { id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl }]));
        }
        
        allArticles = rows.map(article => ({
          ...article,
          author: article.authorId ? authorsMap.get(article.authorId) || null : null
        }));
      }
      const mapArticles = new Map(allArticles.map((a) => [a.id, a] as const));

      let allCategories: Category[] = [];
      if (wantedCategoryIds.length > 0) {
        const rows = await this.categoryRepo.find({ where: { id: In(wantedCategoryIds) } });
        allCategories = rows;
      }
      const mapCategories = new Map(allCategories.map((c) => [c.id, c] as const));

      resolvedSections = rawSections.map((s) => {
        if (s && s.kind === 'featuredGrid' && Array.isArray(s.articleIds)) {
          const articles = s.articleIds.map((id: string) => mapArticles.get(id)).filter(Boolean);
          return { ...s, articles };
        }
        if (s && s.kind === 'categoryGrid' && Array.isArray(s.categoryIds)) {
          const categories = s.categoryIds.map((id: string) => {
            const c = mapCategories.get(id);
            return c ? { id: c.id, name: c.name } : null;
          }).filter(Boolean);
          return { ...s, categories };
        }
        return s;
      });
    }

    return {
      success: true,
      data: {
        heroTitle: cfg.heroTitle ?? null,
        heroSubtitle: cfg.heroSubtitle ?? null,
        heroImageUrl: cfg.heroImageUrl ?? null,
        sections: resolvedSections,
        featuredArticles: featured,
      },
    };
  }
}
