// src/subscriptions/subscriptions.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Subscription } from './subscription.entity';
import { NotificationQueue } from './notification-queue.entity';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/create-subscription.dto';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { Article } from '../articles/article.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(NotificationQueue)
    private notificationQueueRepository: Repository<NotificationQueue>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async createSubscription(userId: string, createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    const { type, targetId, frequency = 'instant' } = createSubscriptionDto;

    // Check if subscription already exists
    const whereCondition: any = { userId, type };
    if (targetId) {
      whereCondition.targetId = targetId;
    } else {
      whereCondition.targetId = null;
    }
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: whereCondition
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        throw new ConflictException('Subscription already exists');
      } else {
        // Reactivate existing subscription
        existingSubscription.isActive = true;
        existingSubscription.frequency = frequency;
        return await this.subscriptionRepository.save(existingSubscription);
      }
    }

    // Validate targetId if provided
    if (type === 'category' && targetId) {
      const category = await this.categoryRepository.findOne({ where: { id: targetId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    if (type === 'author' && targetId) {
      const author = await this.userRepository.findOne({ where: { id: targetId } });
      if (!author) {
        throw new NotFoundException('Author not found');
      }
    }

    const subscription = new Subscription();
    subscription.userId = userId;
    subscription.type = type;
    subscription.frequency = frequency;
    subscription.isActive = true;
    if (targetId) {
      subscription.targetId = targetId;
    }

    return await this.subscriptionRepository.save(subscription);
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return await this.subscriptionRepository.find({
      where: { userId, isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' }
    });
  }

  async updateSubscription(userId: string, subscriptionId: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    Object.assign(subscription, updateSubscriptionDto);
    return await this.subscriptionRepository.save(subscription);
  }

  async deleteSubscription(userId: string, subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.isActive = false;
    await this.subscriptionRepository.save(subscription);
  }

  async deleteSubscriptionByTarget(userId: string, type: 'author' | 'category', targetId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, type, targetId, isActive: true }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.isActive = false;
    await this.subscriptionRepository.save(subscription);
  }

  async isSubscribed(userId: string, type: 'author' | 'category', targetId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId, type, targetId, isActive: true }
    });
    return !!subscription;
  }

  async getFollowerCount(authorId: string): Promise<number> {
    return await this.subscriptionRepository.count({
      where: { type: 'author', targetId: authorId, isActive: true }
    });
  }

  async getSubscribersForArticle(article: Article): Promise<User[]> {
    const subscribers = new Set<string>();

    // Get all article subscribers
    const allArticleSubscriptions = await this.subscriptionRepository.find({
      where: { type: 'all_articles', isActive: true },
      relations: ['user']
    });
    allArticleSubscriptions.forEach(sub => subscribers.add(sub.userId));

    // Get category subscribers
    if (article.category?.id) {
      const categorySubscriptions = await this.subscriptionRepository.find({
        where: { type: 'category', targetId: article.category.id, isActive: true },
        relations: ['user']
      });
      categorySubscriptions.forEach(sub => subscribers.add(sub.userId));
    }

    // Get author followers
    if (article.authorId) {
      const authorSubscriptions = await this.subscriptionRepository.find({
        where: { type: 'author', targetId: article.authorId, isActive: true },
        relations: ['user']
      });
      authorSubscriptions.forEach(sub => subscribers.add(sub.userId));
    }

    // Return unique users
    const userIds = Array.from(subscribers);
    if (userIds.length === 0) {
      return [];
    }

    return await this.userRepository.find({
      where: { id: In(userIds) }
    });
  }

  async queueNotifications(article: Article): Promise<void> {
    const subscribers = await this.getSubscribersForArticle(article);
    
    for (const subscriber of subscribers) {
      // Check user's subscription preferences to determine when to send
      const userSubscriptions = await this.subscriptionRepository.find({
        where: { userId: subscriber.id, isActive: true }
      });

      let scheduledFor = new Date();
      let notificationType: 'new_article' | 'author_published' | 'category_update' = 'new_article';

      // Determine notification type and schedule
      const hasAuthorSub = userSubscriptions.some(sub => sub.type === 'author' && sub.targetId === article.authorId);
      const hasCategorySub = userSubscriptions.some(sub => sub.type === 'category' && sub.targetId === article.category?.id);

      if (hasAuthorSub) {
        notificationType = 'author_published';
      } else if (hasCategorySub) {
        notificationType = 'category_update';
      }

      // Get the most restrictive frequency preference
      const frequencies = userSubscriptions.map(sub => sub.frequency);
      let frequency = 'instant';
      if (frequencies.includes('weekly')) {
        frequency = 'weekly';
      } else if (frequencies.includes('daily')) {
        frequency = 'daily';
      }

      // Schedule notification based on frequency
      if (frequency === 'daily') {
        scheduledFor = new Date();
        scheduledFor.setHours(9, 0, 0, 0); // 9 AM next day
        if (scheduledFor <= new Date()) {
          scheduledFor.setDate(scheduledFor.getDate() + 1);
        }
      } else if (frequency === 'weekly') {
        scheduledFor = new Date();
        scheduledFor.setDate(scheduledFor.getDate() + (7 - scheduledFor.getDay())); // Next Sunday
        scheduledFor.setHours(9, 0, 0, 0);
      }

      const notification = this.notificationQueueRepository.create({
        userId: subscriber.id,
        articleId: article.id,
        type: notificationType,
        scheduledFor,
        status: 'pending'
      });

      await this.notificationQueueRepository.save(notification);
    }
  }

  async getPendingNotifications(limit: number = 50): Promise<NotificationQueue[]> {
    const now = new Date();
    return await this.notificationQueueRepository
      .createQueryBuilder('notification')
      .where('notification.status = :status', { status: 'pending' })
      .andWhere('notification.scheduledFor <= :now', { now })
      .leftJoinAndSelect('notification.user', 'user')
      .leftJoinAndSelect('notification.article', 'article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.category', 'category')
      .orderBy('notification.scheduledFor', 'ASC')
      .limit(limit)
      .getMany();
  }

  async markNotificationSent(notificationId: string): Promise<void> {
    await this.notificationQueueRepository.update(notificationId, {
      status: 'sent',
      sentAt: new Date()
    });
  }

  async markNotificationFailed(notificationId: string, errorMessage: string): Promise<void> {
    const notification = await this.notificationQueueRepository.findOne({
      where: { id: notificationId }
    });

    if (notification) {
      notification.retryCount += 1;
      notification.errorMessage = errorMessage;

      if (notification.retryCount >= notification.maxRetries) {
        notification.status = 'failed';
      } else {
        // Reschedule for retry (exponential backoff)
        const retryDelay = Math.pow(2, notification.retryCount) * 60 * 1000; // minutes
        notification.scheduledFor = new Date(Date.now() + retryDelay);
      }

      await this.notificationQueueRepository.save(notification);
    }
  }
}
