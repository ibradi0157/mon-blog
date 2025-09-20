import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserPreferencesService } from './user-preferences.service';

interface RequestWithUser extends Request {
  user: { id: string; role: string; email: string };
}

@Controller('user-preferences')
@UseGuards(JwtAuthGuard)
export class UserPreferencesController {
  constructor(
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  @Post('like/:articleId')
  async likeArticle(
    @Param('articleId') articleId: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      const preference = await this.userPreferencesService.likeArticle(
        req.user.id,
        articleId,
      );
      return {
        success: true,
        data: preference,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to like article',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('like/:articleId')
  async unlikeArticle(
    @Param('articleId') articleId: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      await this.userPreferencesService.unlikeArticle(req.user.id, articleId);
      return {
        success: true,
        message: 'Article unliked successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to unlike article',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('follow/:authorId')
  async followAuthor(
    @Param('authorId') authorId: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      const preference = await this.userPreferencesService.followAuthor(
        req.user.id,
        authorId,
      );
      return {
        success: true,
        data: preference,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to follow author',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('follow/:authorId')
  async unfollowAuthor(
    @Param('authorId') authorId: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      await this.userPreferencesService.unfollowAuthor(req.user.id, authorId);
      return {
        success: true,
        message: 'Author unfollowed successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to unfollow author',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('liked-articles')
  async getLikedArticles(@Request() req: RequestWithUser) {
    try {
      const articles = await this.userPreferencesService.getLikedArticles(
        req.user.id,
      );
      return {
        success: true,
        data: articles.map(article => ({
          id: article.id,
          title: article.title,
          coverUrl: article.coverUrl,
          author: {
            id: article.author?.id || '',
            displayName: article.author?.displayName || 'Unknown Author',
            avatarUrl: article.author?.avatarUrl || null,
          },
          createdAt: article.createdAt,
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch liked articles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('followed-authors')
  async getFollowedAuthors(@Request() req: RequestWithUser) {
    try {
      const authors = await this.userPreferencesService.getFollowedAuthors(
        req.user.id,
      );
      return {
        success: true,
        data: authors.map(author => ({
          id: author.id,
          displayName: author.displayName,
          avatarUrl: author.avatarUrl,
          bio: author.bio,
          articlesCount: (author as any).articlesCount || 0,
          followersCount: (author as any).followersCount || 0,
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch followed authors',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('article/:articleId/liked')
  async isArticleLiked(
    @Param('articleId') articleId: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      const isLiked = await this.userPreferencesService.isArticleLiked(
        req.user.id,
        articleId,
      );
      return {
        success: true,
        data: { isLiked },
      };
    } catch (error) {
      throw new HttpException(
        'Failed to check article like status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('author/:authorId/followed')
  async isAuthorFollowed(
    @Param('authorId') authorId: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      const isFollowed = await this.userPreferencesService.isAuthorFollowed(
        req.user.id,
        authorId,
      );
      return {
        success: true,
        data: { isFollowed },
      };
    } catch (error) {
      throw new HttpException(
        'Failed to check author follow status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
