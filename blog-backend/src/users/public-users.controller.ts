import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Article } from '../articles/article.entity';
import { ArticleStats } from '../articles/article-stats.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('public-users')
@Controller('users')
export class PublicUsersController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(ArticleStats) private statsRepo: Repository<ArticleStats>,
  ) {}

  @Get('authors')
  async getAuthors() {
    // Get users who have published articles
    const authors = await this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.articles', 'article', 'article.isPublished = :published', { published: true })
      .select([
        'user.id',
        'user.displayName',
        'user.email',
        'user.avatarUrl',
        'user.createdAt',
      ])
      .addSelect('COUNT(DISTINCT article.id)', 'articlesCount')
      .where('article.id IS NOT NULL')
      .groupBy('user.id')
      .having('COUNT(DISTINCT article.id) > 0')
      .orderBy('"articlesCount"', 'DESC')
      .getRawMany();

    // Get total views for each author
    const authorsWithStats = await Promise.all(
      authors.map(async (author) => {
        const stats = await this.statsRepo
          .createQueryBuilder('stats')
          .leftJoin('stats.article', 'article')
          .where('article.authorId = :authorId', { authorId: author.user_id })
          .andWhere('article.isPublished = :published', { published: true })
          .select('SUM(stats.views)', 'totalViews')
          .addSelect('SUM(stats.likes)', 'totalLikes')
          .getRawOne();

        return {
          id: author.user_id,
          displayName: author.user_displayName,
          email: author.user_email,
          profilePicture: author.user_avatarUrl,
          createdAt: author.user_createdAt,
          articlesCount: parseInt(author.articlesCount) || 0,
          totalViews: parseInt(stats?.totalViews) || 0,
          totalLikes: parseInt(stats?.totalLikes) || 0,
        };
      })
    );

    return { success: true, data: authorsWithStats };
  }

  @Get('authors/:id')
  async getAuthorProfile(@Param('id') id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'displayName', 'email', 'avatarUrl', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('Auteur introuvable');
    }

    // Get published articles
    const articles = await this.articleRepo.find({
      where: { authorId: id, isPublished: true },
      order: { publishedAt: 'DESC' },
      take: 50,
    });

    // Get stats for each article
    const articlesWithStats = await Promise.all(
      articles.map(async (article) => {
        const stats = await this.statsRepo.findOne({
          where: { article: { id: article.id } },
        });

        return {
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          coverImage: article.coverUrl,
          publishedAt: article.publishedAt,
          viewCount: stats?.views || 0,
          commentCount: stats?.commentsCount || 0,
          tags: article.tags || [],
        };
      })
    );

    // Calculate totals
    const totalStats = articlesWithStats.reduce(
      (acc, article) => ({
        views: acc.views + article.viewCount,
        likes: acc.likes,
      }),
      { views: 0, likes: 0 }
    );

    const allStats = await this.statsRepo
      .createQueryBuilder('stats')
      .leftJoin('stats.article', 'article')
      .where('article.authorId = :authorId', { authorId: id })
      .andWhere('article.isPublished = :published', { published: true })
      .select('SUM(stats.likes)', 'totalLikes')
      .getRawOne();

    return {
      success: true,
      data: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        profilePicture: user.avatarUrl,
        createdAt: user.createdAt,
        articlesCount: articles.length,
        totalViews: totalStats.views,
        totalLikes: parseInt(allStats?.totalLikes) || 0,
        articles: articlesWithStats,
      },
    };
  }
}
