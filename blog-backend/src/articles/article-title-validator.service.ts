import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { ArticleHistoryTitle } from './article-history-title.entity';

@Injectable()
export class ArticleTitleValidatorService {
  constructor(
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(ArticleHistoryTitle) private historyRepo: Repository<ArticleHistoryTitle>,
  ) {}

  async isTitlePreviouslyUsed(title: string): Promise<boolean> {
    // Vérifier dans les articles existants
    const existingArticle = await this.articleRepo.findOne({ where: { title } });
    if (existingArticle) return true;

    // Vérifier dans l'historique des titres
    const historicTitle = await this.historyRepo.findOne({ where: { title } });
    return !!historicTitle;
  }

  async validateNewTitle(title: string): Promise<{ isValid: boolean; message?: string }> {
    if (!title || title.trim().length === 0) {
      return { isValid: false, message: 'Le titre ne peut pas être vide' };
    }

    if (title.length > 200) {
      return { isValid: false, message: 'Le titre ne peut pas dépasser 200 caractères' };
    }

    // Vérifier si le titre a déjà été utilisé
    const wasUsed = await this.isTitlePreviouslyUsed(title);
    if (wasUsed) {
      return { isValid: false, message: 'Ce titre a déjà été utilisé et ne peut pas être réutilisé' };
    }

    return { isValid: true };
  }

  async addToHistory(title: string, articleId: string): Promise<void> {
    const historyEntry = this.historyRepo.create({
      title,
      originalArticleId: articleId
    });
    await this.historyRepo.save(historyEntry);
  }
}