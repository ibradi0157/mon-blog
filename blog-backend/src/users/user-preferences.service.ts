import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../articles/article.entity';
import { User } from '../users/user.entity';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getLikedArticles(userId: string, page = 1, limit = 10) {
    const query = this.articleRepo
      .createQueryBuilder('article')
      .innerJoin('article.likes', 'like', 'like.userId = :userId', { userId })
      .leftJoinAndSelect('article.author', 'author')
      .orderBy('like.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [articles, total] = await query.getManyAndCount();

    return {
      data: articles.map(article => ({
        id: article.id,
        title: article.title,
        coverUrl: article.coverUrl,
        createdAt: article.createdAt,
        author: article.author
          ? {
              displayName: article.author.displayName,
              avatarUrl: article.author.avatarUrl,
            }
          : {
              displayName: 'Auteur inconnu',
              avatarUrl: null as any,
            }
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getFollowedAuthors(userId: string, page = 1, limit = 10) {
    const query = this.userRepo
      .createQueryBuilder('author')
      .innerJoin('author.followers', 'follower', 'follower.followerId = :userId', { userId })
      .loadRelationCountAndMap('author.articlesCount', 'author.articles')
      .loadRelationCountAndMap('author.followersCount', 'author.followers')
      .orderBy('follower.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [authors, total] = await query.getManyAndCount();

    return {
      data: authors.map(author => ({
        id: author.id,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
        bio: author.bio,
        articlesCount: (author as any).articlesCount,
        followersCount: (author as any).followersCount
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}