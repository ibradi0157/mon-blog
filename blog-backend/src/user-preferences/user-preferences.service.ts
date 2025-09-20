import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UserPreference, PreferenceType } from './user-preferences.entity';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly userPreferenceRepository: Repository<UserPreference>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private getCacheKey(userId: string, type: PreferenceType): string {
    return `user_preferences:${userId}:${type}`;
  }

  async likeArticle(userId: string, articleId: string): Promise<UserPreference> {
    // Check if article exists
    const article = await this.articleRepository.findOne({ 
      where: { id: articleId },
      relations: ['author']
    });
    if (!article) {
      throw new Error('Article not found');
    }

    // Check if already liked
    const existing = await this.userPreferenceRepository.findOne({
      where: {
        userId,
        type: PreferenceType.LIKED_ARTICLE,
        targetId: articleId,
      },
    });

    if (existing) {
      return existing;
    }

    const preference = new UserPreference();
    preference.userId = userId;
    preference.type = PreferenceType.LIKED_ARTICLE;
    preference.targetId = articleId;
    preference.metadata = {
      targetTitle: article.title,
      targetAuthor: article.author?.displayName || 'Unknown Author',
      targetSlug: article.slug || undefined,
    };

    const saved = await this.userPreferenceRepository.save(preference);
    
    // Invalidate cache
    await this.cacheManager.del(this.getCacheKey(userId, PreferenceType.LIKED_ARTICLE));
    
    return saved;
  }

  async unlikeArticle(userId: string, articleId: string): Promise<void> {
    await this.userPreferenceRepository.delete({
      userId,
      type: PreferenceType.LIKED_ARTICLE,
      targetId: articleId,
    });

    // Invalidate cache
    await this.cacheManager.del(this.getCacheKey(userId, PreferenceType.LIKED_ARTICLE));
  }

  async followAuthor(userId: string, authorId: string): Promise<UserPreference> {
    // Check if author exists
    const author = await this.userRepository.findOne({ 
      where: { id: authorId }
    });
    if (!author) {
      throw new Error('Author not found');
    }

    // Check if already following
    const existing = await this.userPreferenceRepository.findOne({
      where: {
        userId,
        type: PreferenceType.FOLLOWED_AUTHOR,
        targetId: authorId,
      },
    });

    if (existing) {
      return existing;
    }

    const preference = new UserPreference();
    preference.userId = userId;
    preference.type = PreferenceType.FOLLOWED_AUTHOR;
    preference.targetId = authorId;
    preference.metadata = {
      targetAuthor: author.displayName,
    };

    const saved = await this.userPreferenceRepository.save(preference);
    
    // Invalidate cache
    await this.cacheManager.del(this.getCacheKey(userId, PreferenceType.FOLLOWED_AUTHOR));
    
    return saved;
  }

  async unfollowAuthor(userId: string, authorId: string): Promise<void> {
    await this.userPreferenceRepository.delete({
      userId,
      type: PreferenceType.FOLLOWED_AUTHOR,
      targetId: authorId,
    });

    // Invalidate cache
    await this.cacheManager.del(this.getCacheKey(userId, PreferenceType.FOLLOWED_AUTHOR));
  }

  async getLikedArticles(userId: string): Promise<Article[]> {
    const cacheKey = this.getCacheKey(userId, PreferenceType.LIKED_ARTICLE);
    const cached = await this.cacheManager.get<Article[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const preferences = await this.userPreferenceRepository.find({
      where: {
        userId,
        type: PreferenceType.LIKED_ARTICLE,
      },
      order: { createdAt: 'DESC' },
    });

    if (preferences.length === 0) {
      return [];
    }

    const articleIds = preferences.map(p => p.targetId);
    const articles = await this.articleRepository.find({
      where: { id: In(articleIds) },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    // Sort articles by preference creation date
    const sortedArticles = articles.sort((a, b) => {
      const prefA = preferences.find(p => p.targetId === a.id);
      const prefB = preferences.find(p => p.targetId === b.id);
      if (!prefA || !prefB) return 0;
      return new Date(prefB.createdAt).getTime() - new Date(prefA.createdAt).getTime();
    });

    await this.cacheManager.set(cacheKey, sortedArticles, 300); // 5 minutes cache
    return sortedArticles;
  }

  async getFollowedAuthors(userId: string): Promise<User[]> {
    const cacheKey = this.getCacheKey(userId, PreferenceType.FOLLOWED_AUTHOR);
    const cached = await this.cacheManager.get<User[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const preferences = await this.userPreferenceRepository.find({
      where: {
        userId,
        type: PreferenceType.FOLLOWED_AUTHOR,
      },
      order: { createdAt: 'DESC' },
    });

    if (preferences.length === 0) {
      return [];
    }

    const authorIds = preferences.map(p => p.targetId);
    const authors = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: authorIds })
      .loadRelationCountAndMap('user.articlesCount', 'user.articles')
      .addSelect('0', 'user_followersCount')
      .getMany();

    // Sort authors by preference creation date
    const sortedAuthors = authors.sort((a, b) => {
      const prefA = preferences.find(p => p.targetId === a.id);
      const prefB = preferences.find(p => p.targetId === b.id);
      if (!prefA || !prefB) return 0;
      return new Date(prefB.createdAt).getTime() - new Date(prefA.createdAt).getTime();
    });

    await this.cacheManager.set(cacheKey, sortedAuthors, 300); // 5 minutes cache
    return sortedAuthors;
  }

  async isArticleLiked(userId: string, articleId: string): Promise<boolean> {
    const preference = await this.userPreferenceRepository.findOne({
      where: {
        userId,
        type: PreferenceType.LIKED_ARTICLE,
        targetId: articleId,
      },
    });
    return !!preference;
  }

  async isAuthorFollowed(userId: string, authorId: string): Promise<boolean> {
    const preference = await this.userPreferenceRepository.findOne({
      where: {
        userId,
        type: PreferenceType.FOLLOWED_AUTHOR,
        targetId: authorId,
      },
    });
    return !!preference;
  }
}
