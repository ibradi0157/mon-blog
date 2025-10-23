// src/articles/articles.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Article } from './article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleStatsService } from './article-stats.service';
import { ArticleTitleValidatorService } from './article-title-validator.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import * as fs from 'fs';
import { join, extname, basename, dirname } from 'path';
import { ArticleReaction } from './article-reaction.entity';
import { Category } from '../categories/category.entity';
import { RoleName } from '../roles/roles.constants';
import { ArticleStats } from './article-stats.entity';
import { Comment } from '../comments/comment.entity';
import { User } from '../users/user.entity';
import { CacheService, CacheKeys } from '../common/cache/cache.service';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article) private repo: Repository<Article>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(ArticleStats) private statsRepo: Repository<ArticleStats>,
    @InjectRepository(ArticleReaction) private reactionRepo: Repository<ArticleReaction>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private cacheService: CacheService,
    private titleValidator: ArticleTitleValidatorService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  private async bumpPublicCacheVersion() {
    await this.cacheService.invalidateTag('articles:public');
    await this.cacheService.invalidateTag('homepage');
  }

    // Optimized query with eager loading to prevent N+1
  private createBaseQuery() {
    return this.repo.createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      // Join stats table explicitly since Article entity has no 'stats' relation
      .leftJoin(ArticleStats, 'stats', 'stats.articleId = article.id');
  }

  private async enrichWithAuthors(articles: Article[]): Promise<any[]> {
    if (!articles.length) return [];
    
    const authorIds = [...new Set(articles.map(a => a.authorId).filter(Boolean))];
    const authorsMap = new Map();
    const articleIds = articles.map(a => a.id);
    // Load stats for these articles
    const statsList = await this.statsRepo.find({
      where: { article: { id: In(articleIds) } as any },
      relations: ['article'],
    });
    const statsMap = new Map<string, ArticleStats>();
    for (const s of statsList) {
      if ((s as any).article?.id) statsMap.set((s as any).article.id, s);
    }
    
    if (authorIds.length) {
      const authors = await this.userRepo.find({
        where: { id: In(authorIds) },
        select: ['id', 'displayName', 'avatarUrl']
      });
      authors.forEach(author => {
        authorsMap.set(author.id, {
          id: author.id,
          displayName: author.displayName,
          avatarUrl: author.avatarUrl
        });
      });
    }
    
    return articles.map(article => {
      const s = statsMap.get(article.id);
      return {
        ...article,
        author: authorsMap.get(article.authorId) || null,
        likes: s?.likes || 0,
        dislikes: s?.dislikes || 0,
        views: s?.views || 0,
        commentsCount: s?.commentsCount || 0,
      };
    });
  }

  async findAllWithPermissions(
    user: any,
    filters: { isPublished?: boolean; search?: string; page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC' } = {}
  ) {
    const cacheKey = CacheKeys.articles.list({ userId: user?.userId, ...filters });
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const role: RoleName = user?.role?.name;
        const qb = this.createBaseQuery();

        // Visibility restrictions by role
        if (role === RoleName.PRIMARY_ADMIN) {
          // no restriction
        } else if (role === RoleName.SECONDARY_ADMIN) {
          qb.andWhere('(article.authorId = :uid OR article.authorRole = :member)', {
            uid: user.userId,
            member: RoleName.MEMBER,
          });
        } else if (role === RoleName.MEMBER) {
          qb.andWhere('article.authorId = :uid', { uid: user.userId });
        } else {
          throw new ForbiddenException('Accès refusé');
        }

        if (typeof filters.isPublished === 'boolean') {
          qb.andWhere('article.isPublished = :pub', { pub: filters.isPublished });
        }
        if (filters.search) {
          qb.andWhere('(article.title ILIKE :s OR article.content ILIKE :s)', { s: `%${filters.search}%` });
        }

        const order: 'ASC' | 'DESC' = (filters.order === 'ASC' ? 'ASC' : 'DESC');
        const sort = (filters.sort || '').toString();
        const articleSorts = new Set(['createdAt', 'updatedAt', 'title', 'isPublished', 'isFeatured']);
        if (!sort || !articleSorts.has(sort)) {
          qb.orderBy('article.createdAt', order);
        } else {
          qb.orderBy(`article.${sort}`, order);
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        qb.skip((page - 1) * limit).take(limit);

        const [data, total] = await qb.getManyAndCount();
        const enrichedData = await this.enrichWithAuthors(data);
        
        return {
          success: true,
          message: 'Articles récupérés',
          data: enrichedData,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        };
      },
      { ttl: 300, tags: ['articles:admin'], namespace: 'articles' }
    );
  }

  async findAllAdmin(
    filters: {
      status?: 'published' | 'draft' | 'unpublished';
      authorId?: string;
      search?: string;
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
    } = {},
  ) {
    const qb = this.repo.createQueryBuilder('article');
    qb.leftJoinAndSelect('article.category', 'category');
    // Join stats to allow sorting by likes/dislikes/views/commentsCount
    qb.leftJoin(ArticleStats, 'stats', 'stats.articleId = article.id');

    if (filters.status) {
      if (filters.status === 'published') qb.andWhere('article.isPublished = TRUE');
      else qb.andWhere('article.isPublished = FALSE');
    }
    if (filters.authorId) {
      qb.andWhere('article.authorId = :authorId', { authorId: filters.authorId });
    }
    if (filters.search) {
      qb.andWhere('(article.title ILIKE :s OR article.content ILIKE :s)', { s: `%${filters.search}%` });
    }

    // Whitelist sort fields to avoid SQL injection and handle stats fields
    const order: 'ASC' | 'DESC' = (filters.order === 'ASC' ? 'ASC' : 'DESC');
    const sort = (filters.sort || '').toString();
    const articleSorts = new Set(['createdAt', 'updatedAt', 'title', 'isPublished', 'isFeatured']);
    if (!sort) {
      qb.orderBy('article.createdAt', order);
    } else if (articleSorts.has(sort)) {
      qb.orderBy(`article.${sort}`, order);
    } else if (sort === 'likes') {
      qb.addSelect('stats.likes', 'sort_likes');
      qb.orderBy('sort_likes', order);
    } else if (sort === 'dislikes') {
      qb.addSelect('stats.dislikes', 'sort_dislikes');
      qb.orderBy('sort_dislikes', order);
    } else if (sort === 'views') {
      qb.addSelect('stats.views', 'sort_views');
      qb.orderBy('sort_views', order);
    } else if (sort === 'comments' || sort === 'commentsCount') {
      qb.addSelect('stats.commentsCount', 'sort_comments');
      qb.orderBy('sort_comments', order);
    } else {
      // Fallback to createdAt if unknown sort provided
      qb.orderBy('article.createdAt', order);
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      message: 'Articles (admin) récupérés',
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  // Admin listing with permissions
  async findAllAdminWithPermissions(
    user: any,
    filters: {
      status?: 'published' | 'draft' | 'unpublished';
      authorId?: string;
      search?: string;
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
    } = {}
  ) {
    const role: RoleName = user?.role?.name;
    const qb = this.repo.createQueryBuilder('article');
    qb.leftJoinAndSelect('article.category', 'category');
    qb.leftJoin(ArticleStats, 'stats', 'stats.articleId = article.id');

    // Restrictions
    if (role === RoleName.PRIMARY_ADMIN) {
      // none
    } else if (role === RoleName.SECONDARY_ADMIN) {
      qb.andWhere('(article.authorId = :uid OR article.authorRole = :member)', {
        uid: user.userId,
        member: RoleName.MEMBER,
      });
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    if (filters.status) {
      if (filters.status === 'published') qb.andWhere('article.isPublished = TRUE');
      else qb.andWhere('article.isPublished = FALSE');
    }
    if (filters.authorId) qb.andWhere('article.authorId = :authorId', { authorId: filters.authorId });
    if (filters.search) qb.andWhere('(article.title ILIKE :s OR article.content ILIKE :s)', { s: `%${filters.search}%` });

    const order: 'ASC' | 'DESC' = (filters.order === 'ASC' ? 'ASC' : 'DESC');
    const sort = (filters.sort || '').toString();
    const articleSorts = new Set(['createdAt', 'updatedAt', 'title', 'isPublished', 'isFeatured']);
    if (!sort) qb.orderBy('article.createdAt', order);
    else if (articleSorts.has(sort)) qb.orderBy(`article.${sort}`, order);
    else if (sort === 'likes') { qb.addSelect('stats.likes', 'sort_likes'); qb.orderBy('sort_likes', order); }
    else if (sort === 'dislikes') { qb.addSelect('stats.dislikes', 'sort_dislikes'); qb.orderBy('sort_dislikes', order); }
    else if (sort === 'views') { qb.addSelect('stats.views', 'sort_views'); qb.orderBy('sort_views', order); }
    else if (sort === 'comments' || sort === 'commentsCount') { qb.addSelect('stats.commentsCount', 'sort_comments'); qb.orderBy('sort_comments', order); }
    else qb.orderBy('article.createdAt', order);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      message: 'Articles (admin) récupérés',
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    } as const;
  }

  async updateCover(id: string, file: Express.Multer.File, user: any) {
    const article = await this.repo.findOneBy({ id });
    if (!article) throw new NotFoundException('Article introuvable');

    const role: RoleName = user.role?.name;
    const isOwner = article.authorId === user.userId;

    if (role === RoleName.PRIMARY_ADMIN) {
      // allowed
    } else if (role === RoleName.SECONDARY_ADMIN) {
      const canOnThis = isOwner || article.authorRole === RoleName.MEMBER;
      if (!canOnThis) {
        throw new ForbiddenException('Vous ne pouvez modifier la couverture que de vos articles ou de ceux des membres');
      }
    } else if (role === RoleName.MEMBER) {
      if (!isOwner) throw new ForbiddenException('Vous ne pouvez modifier la couverture que de vos propres articles');
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    if (article.isPublished) {
      throw new ForbiddenException("Impossible de modifier la couverture d'un article publié. Dépubliez-le d'abord.");
    }

    // cleanup old cover file and its thumbnails if exists
    if (article.coverUrl) {
      const absOld = join(process.cwd(), article.coverUrl.replace(/^\/+/, ''));
      try {
        if (fs.existsSync(absOld)) fs.unlinkSync(absOld);
      } catch (_) {}
      try {
        const dir = dirname(absOld);
        const base = basename(absOld, extname(absOld));
        const ext = extname(absOld);
        if (fs.existsSync(dir)) {
          for (const f of fs.readdirSync(dir)) {
            if (f.startsWith(`${basename(base)}`) && f.includes('-') && f.endsWith(ext)) {
              // matches base-<size>w.ext
              if (/-(\d{2,4})w\.[^.]+$/i.test(f)) {
                try { fs.unlinkSync(join(dir, f)); } catch (_) {}
              }
            }
          }
        }
      } catch (_) {}
    }

    // Optionally optimize image if sharp is available
    await this.optimizeImageFile(file).catch(() => {});

    const relativeUrl = `/uploads/articles/${file.filename}`;
    article.coverUrl = relativeUrl;
    await this.repo.save(article);

    const thumbs = await this.generateThumbnails(file, [400, 800]).catch(() => null);
    await this.bumpPublicCacheVersion();
    return { success: true, message: 'Image de couverture mise à jour', data: { id: article.id, coverUrl: article.coverUrl, thumbnails: thumbs?.urls ?? [] } };
  }

  async removeCover(id: string, user: any) {
    const article = await this.repo.findOneBy({ id });
    if (!article) throw new NotFoundException('Article introuvable');

    const role: RoleName = user.role?.name;
    const isOwner = article.authorId === user.userId;

    if (role === RoleName.PRIMARY_ADMIN) {
      // allowed
    } else if (role === RoleName.SECONDARY_ADMIN) {
      const canOnThis = isOwner || article.authorRole === RoleName.MEMBER;
      if (!canOnThis) {
        throw new ForbiddenException('Vous ne pouvez supprimer la couverture que de vos articles ou de ceux des membres');
      }
    } else if (role === RoleName.MEMBER) {
      if (!isOwner) throw new ForbiddenException('Vous ne pouvez supprimer la couverture que de vos propres articles');
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    if (article.isPublished) {
      throw new ForbiddenException("Impossible de modifier la couverture d'un article publié. Dépubliez-le d'abord.");
    }

    if (article.coverUrl) {
      const abs = join(process.cwd(), article.coverUrl.replace(/^\/+/, ''));
      try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch (_) {}
      try {
        const dir = dirname(abs);
        const base = basename(abs, extname(abs));
        const ext = extname(abs);
        if (fs.existsSync(dir)) {
          for (const f of fs.readdirSync(dir)) {
            if (f.startsWith(`${basename(base)}`) && f.includes('-') && f.endsWith(ext)) {
              if (/(\d{2,4})w\.[^.]+$/i.test(f)) {
                try { fs.unlinkSync(join(dir, f)); } catch (_) {}
              }
            }
          }
        }
      } catch (_) {}
    }
    article.coverUrl = null as any;
    await this.repo.save(article);
    await this.bumpPublicCacheVersion();
    return { success: true, message: 'Image de couverture supprimée', data: { id: article.id, coverUrl: article.coverUrl } };
  }

  async optimizeImageFile(file: Express.Multer.File, opts?: { maxWidth?: number; quality?: number }) {
    const { maxWidth = 1920, quality = 85 } = opts || {};
    const absPath = join(process.cwd(), file.destination?.replace(/^\/+/, '') || '', file.filename);
    const ext = extname(file.filename).toLowerCase();
    
    // Skip GIF optimization to preserve animation
    if (ext === '.gif') return;

    try {
      const sharpMod = (await import('sharp')).default;
      const image = sharpMod(absPath);
      const metadata = await image.metadata();

      // Only process if image is larger than maxWidth
      if (metadata.width && metadata.width > maxWidth) {
        let pipeline = image
          .rotate() // Auto-rotate based on EXIF
          .resize({ width: maxWidth, withoutEnlargement: true })
          .withMetadata(); // Preserve metadata

        // Apply format-specific optimization
        if (ext === '.jpg' || ext === '.jpeg') {
          pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
        } else if (ext === '.png') {
          pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
        } else if (ext === '.webp') {
          pipeline = pipeline.webp({ quality, effort: 6 });
        }

        // Overwrite the original file with optimized version
        await pipeline.toFile(absPath + '.tmp');
        await fs.promises.rename(absPath + '.tmp', absPath);
      } else {
        // Just optimize without resizing
        let pipeline = image.rotate().withMetadata();
        
        if (ext === '.jpg' || ext === '.jpeg') {
          pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
        } else if (ext === '.png') {
          pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
        } else if (ext === '.webp') {
          pipeline = pipeline.webp({ quality, effort: 6 });
        }

        await pipeline.toFile(absPath + '.tmp');
        await fs.promises.rename(absPath + '.tmp', absPath);
      }
    } catch (error) {
      console.error('Error optimizing image:', error);
      // Clean up temp file if it exists
      try {
        await fs.promises.unlink(absPath + '.tmp');
      } catch (_) {}
      throw error;
    }
  }

  // Generate thumbnail files for the uploaded image and return their URLs
  async generateThumbnails(file: Express.Multer.File, sizes: number[] = [400, 800]) {
    const dest = file.destination ?? '';
    const relBase = `/${dest.replace(/^\/+/, '')}`;
    const absDir = join(process.cwd(), dest.replace(/^\/+/, ''));
    const ext = extname(file.filename).toLowerCase();
    if (ext === '.gif') return { urls: [] };

    // dynamic import sharp
    let sharpMod: any;
    try {
      sharpMod = (await import('sharp')).default;
    } catch (_) {
      return { urls: [] };
    }

    const base = file.filename.replace(new RegExp(`${ext.replace('.', '\\.')}$`), '');
    const urls: string[] = [];
    try {
      await Promise.all(
        sizes.map(async (w) => {
          const outName = `${base}-${w}w${ext}`;
          const outAbs = join(absDir, outName);
          let pipeline = sharpMod(join(absDir, file.filename)).rotate().withMetadata().resize({ width: w, withoutEnlargement: true });
          if (ext === '.jpg' || ext === '.jpeg') pipeline = pipeline.jpeg({ quality: 80 });
          else if (ext === '.png') pipeline = pipeline.png({ compressionLevel: 9 });
          else if (ext === '.webp') pipeline = pipeline.webp({ quality: 80 });
          await pipeline.toFile(outAbs);
          urls.push(`${relBase}/${outName}`);
        })
      );
    } catch (_) {}
    return { urls };
  }

  async findOneWithPermissions(id: string, user: any) {
    const article = await this.repo.findOneBy({ id });
    if (!article) throw new NotFoundException('Article introuvable');

    const role: RoleName = user?.role?.name;
    const isOwner = article.authorId === user?.userId;

    // Règle: brouillon lisible uniquement par l'auteur, quel que soit le rôle
    if (!article.isPublished && !isOwner) {
      throw new ForbiddenException('Accès refusé au brouillon');
    }

    if (role === RoleName.PRIMARY_ADMIN) {
      // allowed
    } else if (role === RoleName.SECONDARY_ADMIN) {
      const canOnThis = isOwner || article.authorRole === RoleName.MEMBER;
      if (!canOnThis) {
        throw new ForbiddenException('Accès refusé');
      }
    } else if (role === RoleName.MEMBER) {
      if (!isOwner) throw new ForbiddenException('Accès refusé');
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    return article;
  }

  async findAllPaginatedWithPermissions(
    user: any,
    opts: { page: number; limit: number }
  ) {
    return this.findAllWithPermissions(user, { page: opts.page, limit: opts.limit });
  }

  private slugify(text: string): string {
    return String(text)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 120);
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = this.slugify(title);
    // Fetch existing slugs with same base or base-n pattern
    const rows = await this.repo
      .createQueryBuilder('a')
      .select(['a.slug'])
      .where('a.slug = :base OR a.slug LIKE :pattern', { base, pattern: `${base}-%` })
      .getMany();
    const existing = new Set(rows.map((r) => r.slug));
    if (!existing.has(base)) return base;
    // Find first available suffix
    for (let i = 2; i < 1000; i++) {
      const candidate = `${base}-${i}`;
      if (!existing.has(candidate)) return candidate;
    }
    // Fallback with timestamp
    return `${base}-${Date.now()}`;
  }

  async create(dto: CreateArticleDto) {
    // Validate title uniqueness
    const titleValidation = await this.titleValidator.validateNewTitle(dto.title);
    if (!titleValidation.isValid) {
      throw new BadRequestException(titleValidation.message);
    }

    const article = this.repo.create({
      title: dto.title,
      content: dto.content,
      isPublished: dto.isPublished ?? false,
      isFeatured: dto.isFeatured ?? false,
      authorId: dto.authorId!,
      authorRole: dto.authorRole!,
    });

    // assign category if provided
    if (dto.categoryId) {
      const cat = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!cat) throw new NotFoundException('Catégorie introuvable');
      article.category = cat;
    }

    // ensure unique slug to avoid 23505 on unique index
    article.slug = await this.generateUniqueSlug(article.title);
    const saved = await this.repo.save(article);
    const withRelations = await this.repo.findOne({ 
      where: { id: saved.id },
      relations: ['category']
    });
    await this.bumpPublicCacheVersion();
    return { success: true, message: 'Article créé', data: withRelations! };
  }

  async updateWithPermissions(id: string, body: Partial<Article>, user: any) {
    const article = await this.repo.findOneBy({ id });
    if (!article) throw new NotFoundException('Article introuvable');

    const role: RoleName = user?.role?.name;
    const isOwner = article.authorId === user?.userId;

    if (role === RoleName.PRIMARY_ADMIN) {
      // allowed
    } else if (role === RoleName.SECONDARY_ADMIN) {
      const canOnThis = isOwner || article.authorRole === RoleName.MEMBER;
      if (!canOnThis) {
        throw new ForbiddenException('Accès refusé');
      }
    } else if (role === RoleName.MEMBER) {
      if (!isOwner) throw new ForbiddenException('Accès refusé');
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    if (article.isPublished) {
      throw new ForbiddenException("Impossible de modifier un article publié. Dépubliez-le d'abord.");
    }

    // handle category update if requested
    const incoming: any = body as any;
    if (Object.prototype.hasOwnProperty.call(incoming, 'categoryId')) {
      const cid = incoming.categoryId;
      if (cid === null || cid === '') {
        article.category = null as any;
      } else if (typeof cid === 'string') {
        const cat = await this.categoryRepo.findOne({ where: { id: cid } });
        if (!cat) throw new NotFoundException('Catégorie introuvable');
        article.category = cat;
      }
      delete incoming.categoryId;
    }

    // prevent reassignment of ownership via payload
    const { authorId, authorRole, id: _, createdAt, updatedAt, ...updatable } = incoming;
    Object.assign(article, updatable);
    const saved = await this.repo.save(article);
    const withRelations = await this.repo.findOne({ 
      where: { id: saved.id },
      relations: ['category']
    });
    await this.bumpPublicCacheVersion();
    return { success: true, message: 'Article mis à jour', data: withRelations! };
  }

  async deleteWithPermissions(id: string, user: any) {
    const article = await this.repo.findOneBy({ id });
    if (!article) throw new NotFoundException('Article introuvable');

    const role: RoleName = user?.role?.name;
    const isOwner = article.authorId === user?.userId;

    if (role === RoleName.PRIMARY_ADMIN) {
      // allowed
    } else if (role === RoleName.SECONDARY_ADMIN) {
      const canOnThis = isOwner || article.authorRole === RoleName.MEMBER;
      if (!canOnThis) {
        throw new ForbiddenException('Accès refusé');
      }
    } else if (role === RoleName.MEMBER) {
      if (!isOwner) throw new ForbiddenException('Accès refusé');
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    // remove cover file if present
    if (article.coverUrl) {
      const abs = join(process.cwd(), article.coverUrl.replace(/^\/+/, ''));
      try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch (_) {}
      try {
        const dir = dirname(abs);
        const base = basename(abs, extname(abs));
        const ext = extname(abs);
        if (fs.existsSync(dir)) {
          for (const f of fs.readdirSync(dir)) {
            if (f.startsWith(`${basename(base)}`) && f.includes('-') && f.endsWith(ext)) {
              if (/(\d{2,4})w\.[^.]+$/i.test(f)) {
                try { fs.unlinkSync(join(dir, f)); } catch (_) {}
              }
            }
          }
        }
      } catch (_) {}
    }

    await this.repo.delete(id);
    await this.bumpPublicCacheVersion();
    return { success: true, message: 'Article supprimé' };
  }

  async publish(id: string, user: any) {
    const article = await this.repo.findOneBy({ id });
    if (!article) throw new NotFoundException('Article introuvable');

    const role: RoleName = user?.role?.name;
    const isOwner = article.authorId === user?.userId;

    if (role === RoleName.PRIMARY_ADMIN) {
      // allowed
    } else if (role === RoleName.SECONDARY_ADMIN) {
      const canOnThis = isOwner || article.authorRole === RoleName.MEMBER;
      if (!canOnThis) {
        throw new ForbiddenException('Accès refusé');
      }
    } else if (role === RoleName.MEMBER) {
      if (!isOwner) throw new ForbiddenException('Accès refusé');
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    article.isPublished = true;
    article.publishedAt = new Date();
    const saved = await this.repo.save(article);
    
    // Queue notifications for subscribers
    try {
      await this.subscriptionsService.queueNotifications(saved);
    } catch (error) {
      console.error('Failed to queue notifications:', error);
      // Don't fail the publish operation if notification queueing fails
    }
    
    await this.bumpPublicCacheVersion();
    return { success: true, message: 'Article publié', data: saved };
  }

  async unpublish(id: string, user: any) {
    const article = await this.repo.findOneBy({ id });
    if (!article) throw new NotFoundException('Article introuvable');

    const role: RoleName = user?.role?.name;
    const isOwner = article.authorId === user?.userId;

    if (role === RoleName.PRIMARY_ADMIN) {
      // allowed
    } else if (role === RoleName.SECONDARY_ADMIN) {
      const canOnThis = isOwner || article.authorRole === RoleName.MEMBER;
      if (!canOnThis) {
        throw new ForbiddenException('Accès refusé');
      }
    } else if (role === RoleName.MEMBER) {
      if (!isOwner) throw new ForbiddenException('Accès refusé');
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    article.isPublished = false;
    const saved = await this.repo.save(article);

    // Delete all comments on unpublish and reset commentsCount
    await this.commentRepo
      .createQueryBuilder()
      .delete()
      .from(Comment)
      .where('articleId = :id', { id })
      .execute();

    const stats = await this.statsRepo.findOne({ where: { article: { id } }, relations: ['article'] });
    if (stats) {
      stats.commentsCount = 0;
      await this.statsRepo.save(stats);
    }

    await this.bumpPublicCacheVersion();
    return { success: true, message: 'Article dépublié', data: saved };
  }

  // Handle like/dislike reactions from authenticated users (including SIMPLE_USER)
  private async getOrCreateStats(article: Article) {
    let stats = await this.statsRepo.findOne({ where: { article: { id: article.id } } });
    if (!stats) {
      stats = this.statsRepo.create({ article, views: 0, likes: 0, dislikes: 0, commentsCount: 0 });
      stats = await this.statsRepo.save(stats);
    }
    return stats;
  }

  private async react(articleId: string, user: any, type: 'like' | 'dislike') {
    const article = await this.repo.findOneBy({ id: articleId });
    if (!article) throw new NotFoundException('Article introuvable');
    if (!article.isPublished) throw new ForbiddenException('Réactions autorisées uniquement sur les articles publiés');

    // one reaction per user per article
    const existing = await this.reactionRepo.findOne({ where: { articleId: article.id, userId: user.userId } });
    const stats = await this.getOrCreateStats(article);

    if (!existing) {
      // create new
      await this.reactionRepo.save(this.reactionRepo.create({ articleId: article.id, userId: user.userId, type }));
      if (type === 'like') stats.likes += 1; else stats.dislikes += 1;
      await this.statsRepo.save(stats);
      return { success: true, message: type === 'like' ? 'Like ajouté' : 'Dislike ajouté', data: { likes: stats.likes ?? 0, dislikes: stats.dislikes ?? 0 } };
    }

    if (existing.type === type) {
      // toggle off
      await this.reactionRepo.delete(existing.id);
      if (type === 'like') stats.likes = Math.max(0, (stats.likes ?? 0) - 1); else stats.dislikes = Math.max(0, (stats.dislikes ?? 0) - 1);
      await this.statsRepo.save(stats);
      return { success: true, message: type === 'like' ? 'Like retiré' : 'Dislike retiré', data: { likes: stats.likes ?? 0, dislikes: stats.dislikes ?? 0 } };
    }

    // switch reaction
    existing.type = type;
    await this.reactionRepo.save(existing);
    if (type === 'like') { stats.likes += 1; stats.dislikes = Math.max(0, (stats.dislikes ?? 0) - 1); }
    else { stats.dislikes += 1; stats.likes = Math.max(0, (stats.likes ?? 0) - 1); }
    await this.statsRepo.save(stats);
    return { success: true, message: type === 'like' ? 'Converti en like' : 'Converti en dislike', data: { likes: stats.likes ?? 0, dislikes: stats.dislikes ?? 0 } };
  }

  async like(id: string, user: any) {
    if (!user?.userId) throw new ForbiddenException('Authentification requise');
    return this.react(id, user, 'like');
  }

  async dislike(id: string, user: any) {
    if (!user?.userId) throw new ForbiddenException('Authentification requise');
    return this.react(id, user, 'dislike');
  }

  async findOneAdmin(id: string) {
    const article = await this.repo.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable');
    return { success: true, data: article };
  }

  async findOneAdminWithPermissions(user: any, id: string) {
    const role: RoleName = user?.role?.name;
    const article = await this.repo.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable');

    if (role === RoleName.PRIMARY_ADMIN) {
      // allowed
    } else if (role === RoleName.SECONDARY_ADMIN) {
      const canView = article.authorId === user.userId || article.authorRole === RoleName.MEMBER;
      if (!canView) throw new ForbiddenException('Accès refusé');
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    return { success: true, data: article } as const;
  }

  // Public endpoints with optimized caching
  async findPublic(filters: { search?: string; page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC'; categoryId?: string } = {}) {
    const cacheKey = CacheKeys.articles.public(filters);
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const qb = this.createBaseQuery();
        qb.where('article.isPublished = :pub', { pub: true });

        if (filters.search) {
          qb.andWhere('(article.title ILIKE :s OR article.content ILIKE :s)', { s: `%${filters.search}%` });
        }

        if (filters.categoryId) {
          qb.andWhere('category.id = :cid', { cid: filters.categoryId });
        }

        // Optimized sorting with proper joins
        if (filters.sort) {
          if (['likes', 'dislikes', 'views', 'comments', 'commentsCount'].includes(filters.sort)) {
            const statField = filters.sort === 'comments' ? 'commentsCount' : filters.sort;
            qb.orderBy(`stats.${statField}`, filters.order ?? 'DESC');
            qb.addOrderBy('article.createdAt', 'DESC');
          } else {
            qb.orderBy(`article.${filters.sort}`, filters.order ?? 'DESC');
          }
        } else {
          qb.orderBy('article.createdAt', 'DESC');
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        qb.skip((page - 1) * limit).take(limit);

        const [data, total] = await qb.getManyAndCount();
        const enrichedData = await this.enrichWithAuthors(data);

        return {
          success: true,
          message: 'Articles publics récupérés',
          data: enrichedData,
          pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        };
      },
      { ttl: 600, tags: ['articles:public'], namespace: 'articles' }
    );
  }

  async findOnePublic(id: string) {
    const cacheKey = CacheKeys.articles.detail(id);
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const qb = this.createBaseQuery();
        qb.where('article.id = :id AND article.isPublished = :pub', { id, pub: true });
        
        const article = await qb.getOne();
        if (!article) throw new NotFoundException('Article introuvable');

        // Increment view count asynchronously
        this.incrementViewCount(id).catch(() => {});

        const enrichedData = await this.enrichWithAuthors([article]);
        return { 
          success: true, 
          message: 'Article public récupéré', 
          data: enrichedData[0] 
        };
      },
      { ttl: 1800, tags: ['articles:public'], namespace: 'articles' }
    );
  }

  private async incrementViewCount(articleId: string): Promise<void> {
    try {
      const stats = await this.statsRepo.findOne({ where: { article: { id: articleId } } });
      if (stats) {
        stats.views = (stats.views || 0) + 1;
        await this.statsRepo.save(stats);
        // Invalidate cache after view increment
        await this.cacheService.invalidateTag('articles:public');
      }
    } catch (error) {
      console.warn('Failed to increment view count:', error);
    }
  }
}