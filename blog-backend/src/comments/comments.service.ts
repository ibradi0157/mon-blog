import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Comment } from './comment.entity';
import { Article } from '../articles/article.entity';
import { User } from '../users/user.entity';
import { Permissions } from '../roles/permissions';
import { RoleName } from '../roles/roles.constants';
import { ArticleStats } from '../articles/article-stats.entity';
import { CommentReport, CommentReportStatus } from './comment-report.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private repo: Repository<Comment>,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ArticleStats) private statsRepo: Repository<ArticleStats>,
    @InjectRepository(CommentReport) private reportRepo: Repository<CommentReport>,
  ) {}

  async create(content: string, articleId: string, user: any, parentId?: string) {
    const article = await this.articleRepo.findOneBy({ id: articleId });
    if (!article) throw new NotFoundException('Article introuvable');
    // Only allow commenting on published articles
    if (!article.isPublished) {
      throw new ForbiddenException("Vous ne pouvez commenter qu'un article publié");
    }
    const author = await this.userRepo.findOneBy({ id: user.userId });
    if (!author) throw new NotFoundException('Auteur introuvable');

    let parent: Comment | null = null;
    if (parentId) {
      parent = await this.repo.findOne({ where: { id: parentId }, relations: ['article'] });
      if (!parent) throw new NotFoundException('Commentaire parent introuvable');
      if (parent.article.id !== article.id) throw new ForbiddenException('La réponse doit concerner le même article');
    }

    const comment = this.repo.create({
      content,
      article,
      author,
      authorTag: author.role?.name ?? RoleName.SIMPLE_USER,
      parent: parent ?? null,
    });
    const saved = await this.repo.save(comment);

    // increment comments count (only for top-level? we count all comments)
    let stats = await this.statsRepo.findOne({ where: { article: { id: article.id } }, relations: ['article'] });
    if (!stats) {
      stats = this.statsRepo.create({ article, commentsCount: 1 });
    } else {
      stats.commentsCount += 1;
    }
    await this.statsRepo.save(stats);
    return { success: true, message: 'Commentaire ajouté', data: saved };
  }

  async findAllForArticle(
    articleId: string,
    filters: { search?: string; page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC' } = {}
  ) {
    const query = this.repo.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.article', 'article')
      .where('comment.articleId = :articleId', { articleId })
      .andWhere('comment.parentId IS NULL');

    if (filters.search) {
      query.andWhere('comment.content ILIKE :search', { search: `%${filters.search}%` });
    }

    if (filters.sort) {
      query.orderBy(`comment.${filters.sort}`, filters.order ?? 'DESC');
    } else {
      query.orderBy('comment.createdAt', 'DESC');
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return {
      success: true,
      message: 'Commentaires récupérés',
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(filters: {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
    articleId?: string;
    authorId?: string;
    authorRole?: RoleName;
  } = {}) {
    const qb = this.repo.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.article', 'article');

    if (filters.articleId) {
      qb.andWhere('article.id = :articleId', { articleId: filters.articleId });
    }
    if (filters.authorId) {
      qb.andWhere('author.id = :authorId', { authorId: filters.authorId });
    }
    if (filters.authorRole) {
      qb.andWhere('comment.authorTag = :authorRole', { authorRole: filters.authorRole });
    }
    if (filters.search) {
      qb.andWhere(new Brackets((exp) => {
        exp.where('comment.content ILIKE :q', { q: `%${filters.search}%` })
          .orWhere('author.email ILIKE :q', { q: `%${filters.search}%` })
          .orWhere('author.displayName ILIKE :q', { q: `%${filters.search}%` })
          .orWhere('article.title ILIKE :q', { q: `%${filters.search}%` });
      }));
    }

    if (filters.sort) {
      qb.orderBy(`comment.${filters.sort}`, filters.order ?? 'DESC');
    } else {
      qb.orderBy('comment.createdAt', 'DESC');
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      message: 'Commentaires (admin) récupérés',
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findAllWithPermissions(
    user: any,
    filters: {
      search?: string;
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
      articleId?: string;
      authorId?: string;
      authorRole?: RoleName;
    } = {}
  ) {
    const role: RoleName = user?.role?.name;
    const qb = this.repo.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.article', 'article');

    // Base filters
    if (filters.articleId) qb.andWhere('article.id = :articleId', { articleId: filters.articleId });
    if (filters.authorId) qb.andWhere('author.id = :authorId', { authorId: filters.authorId });
    if (filters.authorRole) qb.andWhere('comment.authorTag = :authorRole', { authorRole: filters.authorRole });
    if (filters.search) {
      qb.andWhere(new Brackets((exp) => {
        exp.where('comment.content ILIKE :q', { q: `%${filters.search}%` })
          .orWhere('author.email ILIKE :q', { q: `%${filters.search}%` })
          .orWhere('author.displayName ILIKE :q', { q: `%${filters.search}%` })
          .orWhere('article.title ILIKE :q', { q: `%${filters.search}%` });
      }));
    }

    // Permission restrictions
    if (role === RoleName.PRIMARY_ADMIN) {
      // no additional restriction
    } else if (role === RoleName.SECONDARY_ADMIN) {
      // only comments by members or simple users
      qb.andWhere('comment.authorTag IN (:...allowedTags)', { allowedTags: [RoleName.MEMBER, RoleName.SIMPLE_USER] });
      // and only on own articles or members' articles
      qb.andWhere('(article.authorId = :uid OR article.authorRole = :memberRole)', {
        uid: user.userId,
        memberRole: RoleName.MEMBER,
      });
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    if (filters.sort) qb.orderBy(`comment.${filters.sort}`, filters.order ?? 'DESC');
    else qb.orderBy('comment.createdAt', 'DESC');

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      message: 'Commentaires (admin) récupérés',
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findAllForMemberArticles(
    ownerId: string,
    filters: { search?: string; page?: number; limit?: number; sort?: string; order?: 'ASC' | 'DESC'; articleId?: string } = {}
  ) {
    const qb = this.repo.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.article', 'article')
      .where('article.authorId = :ownerId', { ownerId });

    if (filters.articleId) {
      qb.andWhere('article.id = :articleId', { articleId: filters.articleId });
    }
    if (filters.search) {
      qb.andWhere(new Brackets((exp) => {
        exp.where('comment.content ILIKE :q', { q: `%${filters.search}%` })
          .orWhere('author.email ILIKE :q', { q: `%${filters.search}%` })
          .orWhere('author.displayName ILIKE :q', { q: `%${filters.search}%` })
          .orWhere('article.title ILIKE :q', { q: `%${filters.search}%` });
      }));
    }

    if (filters.sort) {
      qb.orderBy(`comment.${filters.sort}`, filters.order ?? 'DESC');
    } else {
      qb.orderBy('comment.createdAt', 'DESC');
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      message: 'Commentaires (membre) récupérés',
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async update(commentId: string, content: string, user: any) {
    const comment = await this.repo.findOne({ where: { id: commentId }, relations: ['author', 'article', 'author.role'] });
    if (!comment) throw new NotFoundException('Commentaire introuvable');

    const actorRole: RoleName = user.role.name;
    const isOwner = comment.author.id === user.userId;
    const targetAuthorRole: RoleName | undefined = comment.author.role?.name as RoleName | undefined;
    const articleOwnerRole: RoleName | undefined = comment.article.authorRole as RoleName | undefined;
    const isActorArticleOwner = comment.article.authorId === user.userId;

    if (actorRole === RoleName.PRIMARY_ADMIN) {
      // allowed
    } else if (actorRole === RoleName.SECONDARY_ADMIN) {
      if (!isOwner) {
        // cannot edit admins' comments (PRIMARY or SECONDARY)
        if (targetAuthorRole === RoleName.PRIMARY_ADMIN || targetAuthorRole === RoleName.SECONDARY_ADMIN) {
          throw new ForbiddenException('Vous ne pouvez pas modifier le commentaire d\'un administrateur');
        }
        // cannot moderate comments on admins’ articles except own articles
        if (articleOwnerRole === RoleName.PRIMARY_ADMIN) {
          throw new ForbiddenException('Vous ne pouvez pas modifier les commentaires sur les articles d\'un administrateur principal');
        }
        if (articleOwnerRole === RoleName.SECONDARY_ADMIN && !isActorArticleOwner) {
          throw new ForbiddenException('Vous ne pouvez pas modifier les commentaires sur les articles des administrateurs secondaires');
        }
      }
    } else if (actorRole === RoleName.MEMBER) {
      // Members can edit comments on their own articles
      if (!isOwner && !isActorArticleOwner) {
        throw new ForbiddenException('Vous ne pouvez modifier que vos commentaires ou ceux sous vos propres articles');
      }
    } else {
      if (!isOwner) throw new ForbiddenException('Vous ne pouvez modifier que vos propres commentaires');
    }

    comment.content = content;
    const saved = await this.repo.save(comment);
    return { success: true, message: 'Commentaire mis à jour', data: saved };
  }

  async delete(commentId: string, user: any) {
    const comment = await this.repo.findOne({
      where: { id: commentId },
      relations: ['author', 'article', 'author.role'],
    });
    if (!comment) throw new NotFoundException('Commentaire introuvable');

    const actorRole: RoleName = user.role.name;
    const isOwner = comment.author.id === user.userId;
    const targetAuthorRole: RoleName | undefined = comment.author.role?.name as RoleName | undefined;
    const articleOwnerRole: RoleName | undefined = comment.article.authorRole as RoleName | undefined;
    const isActorArticleOwner = comment.article.authorId === user.userId;

    if (actorRole === RoleName.PRIMARY_ADMIN) {
      // always allowed
    } else if (actorRole === RoleName.SECONDARY_ADMIN) {
      if (!isOwner) {
        if (targetAuthorRole === RoleName.PRIMARY_ADMIN || targetAuthorRole === RoleName.SECONDARY_ADMIN) {
          throw new ForbiddenException('Vous ne pouvez pas supprimer le commentaire d\'un administrateur');
        }
        if (articleOwnerRole === RoleName.PRIMARY_ADMIN) {
          throw new ForbiddenException('Vous ne pouvez pas supprimer les commentaires sur les articles d\'un administrateur principal');
        }
        if (articleOwnerRole === RoleName.SECONDARY_ADMIN && !isActorArticleOwner) {
          throw new ForbiddenException('Vous ne pouvez pas supprimer les commentaires sur les articles des administrateurs secondaires');
        }
      }
    } else if (actorRole === RoleName.MEMBER) {
      // Members can delete comments on their own articles
      if (!isOwner && !isActorArticleOwner) {
        throw new ForbiddenException('Vous ne pouvez supprimer que vos commentaires ou ceux sous vos propres articles');
      }
    } else {
      if (!isOwner) throw new ForbiddenException('Vous ne pouvez supprimer que vos propres commentaires');
    }

    await this.repo.delete(commentId);
    // decrement comments count
    const stats = await this.statsRepo.findOne({ where: { article: { id: comment.article.id } }, relations: ['article'] });
    if (stats) {
      stats.commentsCount = Math.max(0, (stats.commentsCount ?? 0) - 1);
      await this.statsRepo.save(stats);
    }
    return { success: true, message: 'Commentaire supprimé avec succès' };
  }

  async findReplies(parentId: string, filters: { page?: number; limit?: number } = {}) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const qb = this.repo.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.article', 'article')
      .where('comment.parentId = :parentId', { parentId })
      .orderBy('comment.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      message: 'Réponses récupérées',
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  // Reports
  async reportComment(commentId: string, reason: string, user: any) {
    const comment = await this.repo.findOne({ where: { id: commentId }, relations: ['author', 'article'] });
    if (!comment) throw new NotFoundException('Commentaire introuvable');

    const reporter = await this.userRepo.findOneBy({ id: user.userId });
    if (!reporter) throw new NotFoundException('Utilisateur introuvable');

    const existing = await this.reportRepo.findOne({
      where: {
        comment: { id: commentId } as any,
        reporter: { id: reporter.id } as any,
        status: 'PENDING' as CommentReportStatus,
      },
    });
    if (existing) {
      return { success: true, message: 'Signalement déjà enregistré', data: existing };
    }

    const report = this.reportRepo.create({ comment, reporter, reason, status: 'PENDING' });
    const saved = await this.reportRepo.save(report);
    return { success: true, message: 'Signalement créé', data: saved };
  }

  async listReports(filters: { status?: CommentReportStatus; page?: number; limit?: number } = {}) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const qb = this.reportRepo.createQueryBuilder('report')
      .leftJoinAndSelect('report.comment', 'comment')
      .leftJoinAndSelect('comment.author', 'commentAuthor')
      .leftJoinAndSelect('comment.article', 'article')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .orderBy('report.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.status) {
      qb.andWhere('report.status = :status', { status: filters.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      message: 'Signalements récupérés',
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async resolveReport(reportId: string, action: 'RESOLVED' | 'DISMISSED', _user: any) {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Signalement introuvable');
    report.status = action;
    await this.reportRepo.save(report);
    return { success: true, message: 'Signalement mis à jour' };
  }
}