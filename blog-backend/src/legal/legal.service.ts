import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalPage } from './legal-page.entity.js';

export type LegalSlug = 'privacy' | 'terms';

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(LegalPage)
    private readonly repo: Repository<LegalPage>,
  ) {}

  // Admin: get by slug (no publish filter)
  async getBySlug(slug: LegalSlug): Promise<LegalPage> {
    const page = await this.repo.findOne({ where: { slug } });
    if (!page) throw new NotFoundException(`Legal page '${slug}' not found`);
    return page;
  }

  // Admin: list all (no publish filter)
  async getAll(): Promise<LegalPage[]> {
    return this.repo.find({ order: { slug: 'ASC' } });
  }

  // Public: list only published
  async getPublicAll(): Promise<LegalPage[]> {
    return this.repo.find({ where: { published: true }, order: { slug: 'ASC' } });
  }

  // Public: get published by slug
  async getPublicBySlug(slug: LegalSlug): Promise<LegalPage> {
    const page = await this.repo.findOne({ where: { slug, published: true } });
    if (!page) throw new NotFoundException(`Legal page '${slug}' not found`);
    return page;
  }

  async upsert(slug: LegalSlug, data: { title: string; content: string }): Promise<LegalPage> {
    let page = await this.repo.findOne({ where: { slug } });
    if (!page) {
      page = this.repo.create({ slug, title: data.title, content: data.content });
    } else {
      page.title = data.title;
      page.content = data.content;
    }
    return this.repo.save(page);
  }

  async setPublished(slug: LegalSlug, published: boolean): Promise<LegalPage> {
    const page = await this.repo.findOne({ where: { slug } });
    if (!page) throw new NotFoundException(`Legal page '${slug}' not found`);
    page.published = published;
    return this.repo.save(page);
  }
}


