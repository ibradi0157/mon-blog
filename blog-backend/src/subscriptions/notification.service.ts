// src/subscriptions/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { EmailService } from './email.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Process notification queue (can be called manually or via cron)
  async processNotificationQueue(): Promise<void> {
    try {
      const pendingNotifications = await this.subscriptionsService.getPendingNotifications(10);
      
      if (pendingNotifications.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pendingNotifications.length} pending notifications`);

      for (const notification of pendingNotifications) {
        try {
          // Create in-app notification
          const article = (notification as any).article;
          const author = article?.author;
          
          await this.notificationsService.create({
            userId: notification.userId,
            type: 'article_published',
            title: 'Nouvel article publié',
            message: `${author?.displayName || 'Un auteur'} a publié un nouvel article : ${article?.title || 'Sans titre'}`,
            link: `/article/${article?.id}`,
            payload: {
              articleId: article?.id,
              authorId: author?.id,
            }
          });
          
          // Send email notification
          const success = await this.emailService.sendNotificationEmail(notification);
          
          if (success) {
            await this.subscriptionsService.markNotificationSent(notification.id);
            this.logger.log(`Notification sent successfully: ${notification.id}`);
          } else {
            await this.subscriptionsService.markNotificationFailed(
              notification.id, 
              'Failed to send email'
            );
            this.logger.error(`Failed to send notification: ${notification.id}`);
          }
        } catch (error) {
          await this.subscriptionsService.markNotificationFailed(
            notification.id, 
            error.message
          );
          this.logger.error(`Error processing notification ${notification.id}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error processing notification queue: ${error.message}`);
    }
  }

  // Manual trigger for immediate notifications (useful for testing)
  async processImmediateNotifications(): Promise<void> {
    await this.processNotificationQueue();
  }
}
