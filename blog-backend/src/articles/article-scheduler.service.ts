import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, DeepPartial } from 'typeorm';
import { ScheduledArticle, ScheduleStatus } from './scheduled-article.entity';
import { Article } from './article.entity';
import { ArticleVersion } from './article-version.entity';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class ArticleSchedulerService {
  private readonly logger = new Logger(ArticleSchedulerService.name);

  constructor(
    @InjectRepository(ScheduledArticle)
    private scheduledRepo: Repository<ScheduledArticle>,
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
    @InjectRepository(ArticleVersion)
    private versionRepo: Repository<ArticleVersion>,
    private cacheService: CacheService,
  ) {}

  // Schedule an article for publication
  async scheduleArticle(
    articleId: string,
    scheduledAt: Date,
    scheduledBy: string,
    options: {
      autoSocialShare?: boolean;
      sendNotification?: boolean;
      timezone?: string;
    } = {}
  ): Promise<ScheduledArticle> {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) {
      throw new Error('Article not found');
    }

    if (article.isPublished) {
      throw new Error('Article is already published');
    }

    // Check if article is already scheduled
    const existing = await this.scheduledRepo.findOne({
      where: { articleId, status: ScheduleStatus.PENDING }
    });

    if (existing) {
      throw new Error('Article is already scheduled for publication');
    }

    const scheduled = this.scheduledRepo.create({
      articleId,
      scheduledAt,
      scheduledBy,
      autoSocialShare: options.autoSocialShare || false,
      sendNotification: options.sendNotification !== false,
      timezone: options.timezone || 'Europe/Paris',
    });

    return await this.scheduledRepo.save(scheduled);
  }

  // Update scheduled publication
  async updateSchedule(
    scheduleId: string,
    updates: {
      scheduledAt?: Date;
      autoSocialShare?: boolean;
      sendNotification?: boolean;
    }
  ): Promise<ScheduledArticle> {
    const schedule = await this.scheduledRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) {
      throw new Error('Scheduled publication not found');
    }

    if (schedule.status !== ScheduleStatus.PENDING) {
      throw new Error('Cannot update non-pending scheduled publication');
    }

    Object.assign(schedule, updates);
    return await this.scheduledRepo.save(schedule);
  }

  // Cancel scheduled publication
  async cancelSchedule(scheduleId: string): Promise<void> {
    const schedule = await this.scheduledRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) {
      throw new Error('Scheduled publication not found');
    }

    schedule.status = ScheduleStatus.CANCELLED;
    await this.scheduledRepo.save(schedule);
  }

  // Get scheduled articles
  async getScheduledArticles(filters: {
    status?: ScheduleStatus;
    scheduledBy?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    data: ScheduledArticle[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.scheduledRepo.createQueryBuilder('scheduled')
      .leftJoinAndSelect('scheduled.article', 'article')
      .orderBy('scheduled.scheduledAt', 'ASC');

    if (filters.status) {
      qb.andWhere('scheduled.status = :status', { status: filters.status });
    }

    if (filters.scheduledBy) {
      qb.andWhere('scheduled.scheduledBy = :scheduledBy', { scheduledBy: filters.scheduledBy });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  // Process scheduled publications (was cron; call from an external scheduler or controller)
  async processScheduledPublications(): Promise<void> {
    this.logger.log('Processing scheduled publications...');

    try {
      const now = new Date();
      const pendingSchedules = await this.scheduledRepo.find({
        where: {
          status: ScheduleStatus.PENDING,
          scheduledAt: LessThanOrEqual(now),
        },
        relations: ['article'],
      });

      for (const schedule of pendingSchedules) {
        await this.publishScheduledArticle(schedule);
      }

      this.logger.log(`Processed ${pendingSchedules.length} scheduled publications`);
    } catch (error) {
      this.logger.error('Error processing scheduled publications:', error);
    }
  }

  // Publish a scheduled article
  private async publishScheduledArticle(schedule: ScheduledArticle): Promise<void> {
    try {
      const article = schedule.article;
      if (!article) {
        throw new Error('Article not found');
      }

      // Create version before publishing
      await this.createVersion(article, `Scheduled publication at ${schedule.scheduledAt.toISOString()}`);

      // Publish the article
      article.isPublished = true;
      article.publishedAt = new Date();
      await this.articleRepo.save(article);

      // Update schedule status
      schedule.status = ScheduleStatus.PUBLISHED;
      schedule.publishedAt = new Date();
      await this.scheduledRepo.save(schedule);

      // Invalidate cache
      await this.cacheService.invalidateTag('articles:public');

      // Send notification if enabled
      if (schedule.sendNotification) {
        await this.sendPublicationNotification(article, schedule);
      }

      // Handle social media sharing if enabled
      if (schedule.autoSocialShare) {
        await this.shareOnSocialMedia(article, schedule);
      }

      this.logger.log(`Successfully published scheduled article: ${article.title}`);
    } catch (error) {
      this.logger.error(`Failed to publish scheduled article ${schedule.articleId}:`, error);

      // Update schedule with error
      schedule.status = ScheduleStatus.FAILED;
      schedule.errorMessage = error.message;
      schedule.retryCount += 1;

      // Retry logic
      if (schedule.retryCount < schedule.maxRetries) {
        schedule.status = ScheduleStatus.PENDING;
        // Reschedule for 5 minutes later
        schedule.scheduledAt = new Date(Date.now() + 5 * 60 * 1000);
      }

      await this.scheduledRepo.save(schedule);
    }
  }

  // Create article version
  async createVersion(
    article: Article,
    changeSummary: string,
    createdBy?: string
  ): Promise<ArticleVersion> {
    // Get current version number
    const lastVersion = await this.versionRepo.findOne({
      where: { articleId: article.id },
      order: { versionNumber: 'DESC' },
    });

    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    const version = this.versionRepo.create({
      articleId: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      coverUrl: article.coverUrl,
      versionNumber,
      changeSummary,
      createdBy: createdBy || 'system',
      isPublished: article.isPublished,
      publishedAt: article.publishedAt,
    } as DeepPartial<ArticleVersion>);

    return await this.versionRepo.save(version as any);
  }

  // Get article versions
  async getArticleVersions(articleId: string): Promise<ArticleVersion[]> {
    return await this.versionRepo.find({
      where: { articleId },
      order: { versionNumber: 'DESC' },
    });
  }

  // Restore article to specific version
  async restoreVersion(articleId: string, versionId: string, restoredBy: string): Promise<Article> {
    const version = await this.versionRepo.findOne({ where: { id: versionId, articleId } });
    if (!version) {
      throw new Error('Version not found');
    }

    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) {
      throw new Error('Article not found');
    }

    // Create current version before restoring
    await this.createVersion(article, `Restored to version ${version.versionNumber}`, restoredBy);

    // Restore article content
    article.title = version.title;
    article.content = version.content;
    article.excerpt = version.excerpt;
    article.coverUrl = version.coverUrl;

    return await this.articleRepo.save(article);
  }

  // Compare versions
  async compareVersions(versionId1: string, versionId2: string): Promise<{
    version1: ArticleVersion;
    version2: ArticleVersion;
    differences: {
      title: boolean;
      content: boolean;
      excerpt: boolean;
      coverUrl: boolean;
    };
  }> {
    const [version1, version2] = await Promise.all([
      this.versionRepo.findOne({ where: { id: versionId1 } }),
      this.versionRepo.findOne({ where: { id: versionId2 } }),
    ]);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    const differences = {
      title: version1.title !== version2.title,
      content: version1.content !== version2.content,
      excerpt: version1.excerpt !== version2.excerpt,
      coverUrl: version1.coverUrl !== version2.coverUrl,
    };

    return { version1, version2, differences };
  }

  // Send publication notification (placeholder)
  private async sendPublicationNotification(article: Article, schedule: ScheduledArticle): Promise<void> {
    // Implementation would depend on notification system
    this.logger.log(`Sending publication notification for article: ${article.title}`);
  }

  // Share on social media (placeholder)
  private async shareOnSocialMedia(article: Article, schedule: ScheduledArticle): Promise<void> {
    // Implementation would depend on social media integrations
    this.logger.log(`Sharing article on social media: ${article.title}`);
  }

  // Cleanup old versions (keep only last 10 versions per article)
  async cleanupOldVersions(): Promise<void> {
    this.logger.log('Cleaning up old article versions...');

    try {
      const articles = await this.articleRepo.find({ select: ['id'] });
      
      for (const article of articles) {
        const versions = await this.versionRepo.find({
          where: { articleId: article.id },
          order: { versionNumber: 'DESC' },
        });

        if (versions.length > 10) {
          const versionsToDelete = versions.slice(10);
          await this.versionRepo.remove(versionsToDelete);
          this.logger.log(`Deleted ${versionsToDelete.length} old versions for article ${article.id}`);
        }
      }
    } catch (error) {
      this.logger.error('Error cleaning up old versions:', error);
    }
  }
}
