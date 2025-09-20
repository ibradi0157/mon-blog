// src/subscriptions/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';
import { EmailService } from './email.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly emailService: EmailService,
  ) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  async processNotificationQueue(): Promise<void> {
    try {
      const pendingNotifications = await this.subscriptionsService.getPendingNotifications(10);
      
      if (pendingNotifications.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pendingNotifications.length} pending notifications`);

      for (const notification of pendingNotifications) {
        try {
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
