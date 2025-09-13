import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './like.entity';
import { Article } from '../articles/article.entity';
import { User } from '../users/user.entity';
import { ArticleStats } from '../articles/article-stats.entity';
import { Comment } from '../comments/comment.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ArticleStats) private statsRepo: Repository<ArticleStats>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
  ) {}

  async likeArticle(articleId: string, userId: string, isLike: boolean) {
    const article = await this.articleRepo.findOneBy({ id: articleId });
    if (!article) throw new NotFoundException('Article introuvable');
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    let like = await this.likeRepo.findOne({ where: { article: { id: articleId }, user: { id: userId } } });

    let message: string;
    if (like) {
      // If repeating the same reaction, remove to get back to neutral
      if (like.isLike === isLike) {
        await this.likeRepo.remove(like);
        message = 'Avis retiré';
      } else {
        like.isLike = isLike;
        await this.likeRepo.save(like);
        message = isLike ? 'Article liké' : 'Article disliké';
      }
    } else {
      like = this.likeRepo.create({ article, user, isLike });
      await this.likeRepo.save(like);
      message = isLike ? 'Article liké' : 'Article disliké';
    }

    // Met à jour les stats
    let stats = await this.statsRepo.findOne({ where: { article: { id: articleId } } });
    if (!stats) {
      stats = this.statsRepo.create({ article, views: 0, likes: 0, dislikes: 0, commentsCount: 0 });
    }
    // Recompte les likes/dislikes
    stats.likes = await this.likeRepo.count({ where: { article: { id: articleId }, isLike: true } });
    stats.dislikes = await this.likeRepo.count({ where: { article: { id: articleId }, isLike: false } });
    await this.statsRepo.save(stats);

    return { success: true, message, data: stats };
  }

  async likeComment(commentId: string, userId: string, isLike: boolean) {
    const comment = await this.commentRepo.findOneBy({ id: commentId });
    if (!comment) throw new NotFoundException('Commentaire introuvable');
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    let like = await this.likeRepo.findOne({ where: { comment: { id: commentId }, user: { id: userId } } });

    let message: string;
    if (like) {
      if (like.isLike === isLike) {
        await this.likeRepo.remove(like);
        message = 'Avis retiré';
      } else {
        like.isLike = isLike;
        await this.likeRepo.save(like);
        message = isLike ? 'Commentaire liké' : 'Commentaire disliké';
      }
    } else {
      like = this.likeRepo.create({ comment, user, isLike });
      await this.likeRepo.save(like);
      message = isLike ? 'Commentaire liké' : 'Commentaire disliké';
    }

    // Met à jour les stats du commentaire
    comment.likes = await this.likeRepo.count({ where: { comment: { id: commentId }, isLike: true } });
    comment.dislikes = await this.likeRepo.count({ where: { comment: { id: commentId }, isLike: false } });
    await this.commentRepo.save(comment);

    return { success: true, message, data: comment };
  }
}