// src/subscriptions/subscriptions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { ScheduleModule } from '@nestjs/schedule'; // Commented out due to missing dependency
import { ConfigModule } from '@nestjs/config';
import { Subscription } from './subscription.entity';
import { NotificationQueue } from './notification-queue.entity';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, NotificationQueue, User, Category]),
    // ScheduleModule.forRoot(),
    ConfigModule,
    SiteSettingsModule,
    EmailTemplatesModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, EmailService, NotificationService],
  exports: [SubscriptionsService, EmailService],
})
export class SubscriptionsModule {}
