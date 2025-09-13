import { Controller, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('articles/:articleId/like')
export class LikesController {
  constructor(private readonly service: LikesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  likeArticle(
    @Param('articleId') articleId: string,
    @Body('isLike') isLike: boolean,
    @Request() req
  ) {
    const liked = ((): boolean => {
      if (isLike === undefined || isLike === null) return true;
      if (typeof isLike === 'string') return isLike === 'true' || isLike === '1';
      return !!isLike;
    })();
    return this.service.likeArticle(articleId, req.user.userId, liked);
  }

  @Post('/comment/:commentId')
  @UseGuards(JwtAuthGuard)
  likeComment(
    @Param('commentId') commentId: string,
    @Body('isLike') isLike: boolean,
    @Request() req
  ) {
    const liked = ((): boolean => {
      if (isLike === undefined || isLike === null) return true;
      if (typeof isLike === 'string') return isLike === 'true' || isLike === '1';
      return !!isLike;
    })();
    return this.service.likeComment(commentId, req.user.userId, liked);
  }
}