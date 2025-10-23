import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleStats } from './article-stats.entity';
import { Article } from './article.entity';
import { Comment } from '../comments/comment.entity';
import { ArticleReaction } from './article-reaction.entity';
import { createHash } from 'crypto';
import type { Request } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { RoleName } from '../roles/roles.constants';
import { Permissions } from '../roles/permissions';

@Injectable()
export class ArticleStatsService {
  constructor(
    @InjectRepository(ArticleStats) private statsRepo: Repository<ArticleStats>,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(ArticleReaction) private reactionRepo: Repository<ArticleReaction>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  private async bumpPublicCacheVersion() {
    await this.cache.set('articles:public:v', Date.now().toString());
  }

  // In-memory cache for view dedup (3h TTL as requested)
  private static readonly VIEW_TTL_MS = 3 * 60 * 60 * 1000;
  private viewCache = new Map<string, number>(); // key: `${articleId}:${identity}` => lastTs

  private viewerIdentity(articleId: string, req: Request, user?: any) {
    if (user?.userId) return `${articleId}:u:${user.userId}`;
    const viewer = (req.headers['x-viewer-id'] as string)?.trim();
    if (viewer) return `${articleId}:a:${viewer}`;
    const xf = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
    const ip = xf || (req.ip as string) || '0.0.0.0';
    const ua = (req.headers['user-agent'] as string) || '';
    const anon = createHash('sha1').update(`${ip}|${ua}`).digest('hex').slice(0, 16);
    return `${articleId}:a:${anon}`;
  }

  // Basic fetch without permission checks (internal use)
  async getStats(articleId: string) {
    let stats = await this.statsRepo.findOne({ where: { article: { id: articleId } }, relations: ['article'] });
    if (!stats) {
      const article = await this.articleRepo.findOneBy({ id: articleId });
      if (!article) throw new NotFoundException('Article introuvable');
      stats = this.statsRepo.create({ article, views: 0, likes: 0, dislikes: 0, commentsCount: 0 });
      stats = await this.statsRepo.save(stats);
    }
    return { success: true, message: 'Statistiques récupérées', data: stats };
  }

  // Fetch with permission checks for authenticated users
  async getStatsWithPermissions(articleId: string, user: any) {
    const statsRes = await this.getStats(articleId);
    const stats = statsRes.data as ArticleStats & { article: Article };
    const article = stats.article;

    const role: RoleName = user.role?.name;
    const isOwner = article.authorId === user.userId;
    if (role === RoleName.MEMBER && !isOwner) {
      throw new ForbiddenException('Accès refusé aux stats de cet article');
    }
    if (role === RoleName.SECONDARY_ADMIN) {
      if (article.authorRole === RoleName.PRIMARY_ADMIN) {
        throw new ForbiddenException('Accès refusé aux stats d\'un administrateur principal');
      }
      if (article.authorRole === RoleName.SECONDARY_ADMIN && !isOwner) {
        throw new ForbiddenException('Accès refusé aux stats d\'un administrateur secondaire');
      }
    }

    return statsRes;
  }

  async incrementViews(articleId: string, req: Request, user?: any) {
    let stats = await this.statsRepo.findOne({ where: { article: { id: articleId } }, relations: ['article'] });
    if (!stats) {
      const article = await this.articleRepo.findOneBy({ id: articleId });
      if (!article) throw new NotFoundException('Article introuvable');
      stats = this.statsRepo.create({ article, views: 0, likes: 0, dislikes: 0, commentsCount: 0 });
      stats = await this.statsRepo.save(stats);
    }

    // dedup within TTL by viewer identity
    const key = this.viewerIdentity(articleId, req, user);
    const now = Date.now();
    const last = this.viewCache.get(key) ?? 0;
    if (now - last < ArticleStatsService.VIEW_TTL_MS) {
      return { success: true, message: 'Vue ignorée (TTL)', data: stats };
    }

    this.viewCache.set(key, now);
    stats.views = (stats.views ?? 0) + 1;
    await this.statsRepo.save(stats);
    await this.bumpPublicCacheVersion();
    return { success: true, message: 'Vue ajoutée', data: stats };
  }

  private async getOrCreateStats(article: Article) {
    let stats = await this.statsRepo.findOne({ where: { article: { id: article.id } } });
    if (!stats) {
      stats = this.statsRepo.create({ article, views: 0, likes: 0, dislikes: 0, commentsCount: 0 });
      stats = await this.statsRepo.save(stats);
    }
    return stats;
  }

  private async react(articleId: string, user: any, type: 'like' | 'dislike') {
    if (!user?.userId) throw new ForbiddenException('Authentification requise');
    const article = await this.articleRepo.findOneBy({ id: articleId });
    if (!article) throw new NotFoundException('Article introuvable');
    if (!article.isPublished) throw new ForbiddenException('Réactions autorisées uniquement sur les articles publiés');

    // one reaction per user per article
    const existing = await this.reactionRepo.findOne({ where: { articleId: article.id, userId: user.userId } });
    const stats = await this.getOrCreateStats(article);

    if (!existing) {
      await this.reactionRepo.save(this.reactionRepo.create({ articleId: article.id, userId: user.userId, type }));
      if (type === 'like') stats.likes += 1; else stats.dislikes += 1;
      await this.statsRepo.save(stats);
      await this.bumpPublicCacheVersion();
      return { success: true, message: type === 'like' ? 'Like ajouté' : 'Dislike ajouté', data: { likes: stats.likes ?? 0, dislikes: stats.dislikes ?? 0 } };
    }

    if (existing.type === type) {
      await this.reactionRepo.delete(existing.id);
      if (type === 'like') stats.likes = Math.max(0, (stats.likes ?? 0) - 1); else stats.dislikes = Math.max(0, (stats.dislikes ?? 0) - 1);
      await this.statsRepo.save(stats);
      await this.bumpPublicCacheVersion();
      return { success: true, message: type === 'like' ? 'Like retiré' : 'Dislike retiré', data: { likes: stats.likes ?? 0, dislikes: stats.dislikes ?? 0 } };
    }

    existing.type = type;
    await this.reactionRepo.save(existing);
    if (type === 'like') { stats.likes += 1; stats.dislikes = Math.max(0, (stats.dislikes ?? 0) - 1); }
    else { stats.dislikes += 1; stats.likes = Math.max(0, (stats.likes ?? 0) - 1); }
    await this.statsRepo.save(stats);
    await this.bumpPublicCacheVersion();
    return { success: true, message: type === 'like' ? 'Converti en like' : 'Converti en dislike', data: { likes: stats.likes ?? 0, dislikes: stats.dislikes ?? 0 } };
  }

  async incrementLikes(articleId: string, user: any) {
    return this.react(articleId, user, 'like');
  }

  async incrementDislikes(articleId: string, user: any) {
    return this.react(articleId, user, 'dislike');
  }

  // Bulk fetch for admin lists to reduce N+1 calls
  async getStatsBulk(ids: string[]) {
    if (!ids?.length) return { success: true, message: 'Aucun ID fourni', data: [] };

    // Fetch stats for requested IDs
    const stats = await this.statsRepo
      .createQueryBuilder('s')
      .leftJoin('s.article', 'a')
      .where('a.id IN (:...ids)', { ids })
      .select(['a.id AS id', 's.views AS views', 's.likes AS likes', 's.dislikes AS dislikes'])
      .getRawMany();

    // Map for quick lookup
    const map = new Map<string, { id: string; views: number; likes: number; dislikes: number }>();
    for (const row of stats) {
      map.set(row.id, {
        id: row.id,
        views: Number(row.views ?? 0),
        likes: Number(row.likes ?? 0),
        dislikes: Number(row.dislikes ?? 0),
      });
    }

    // Comments counts
    const commentsCounts = await this.commentRepo
      .createQueryBuilder('c')
      .leftJoin('c.article', 'a')
      .where('a.id IN (:...ids)', { ids })
      .select('a.id', 'id')
      .addSelect('COUNT(c.id)', 'count')
      .groupBy('a.id')
      .getRawMany();
    const ccMap = new Map<string, number>();
    for (const r of commentsCounts) ccMap.set(r.id, Number(r.count ?? 0));

    // Build result for each requested id, even if missing
    const result = ids.map((id) => ({
      id,
      views: map.get(id)?.views ?? 0,
      likes: map.get(id)?.likes ?? 0,
      dislikes: map.get(id)?.dislikes ?? 0,
      commentsCount: ccMap.get(id) ?? 0,
    }));

    return { success: true, message: 'Statistiques (bulk) récupérées', data: result };
  }
}