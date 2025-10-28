// src/subscriptions/subscriptions.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';
import { SubscriptionsService } from './subscriptions.service';
import { NotificationService } from './notification.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/create-subscription.dto';
import { Subscription } from './subscription.entity';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  async createSubscription(
    @Request() req,
    @Body() createSubscriptionDto: CreateSubscriptionDto
  ): Promise<Subscription> {
    return await this.subscriptionsService.createSubscription(req.user.userId, createSubscriptionDto);
  }

  @Get()
  async getUserSubscriptions(@Request() req): Promise<Subscription[]> {
    return await this.subscriptionsService.getUserSubscriptions(req.user.userId);
  }

  @Put(':id')
  async updateSubscription(
    @Request() req,
    @Param('id') subscriptionId: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto
  ): Promise<Subscription> {
    return await this.subscriptionsService.updateSubscription(req.user.userId, subscriptionId, updateSubscriptionDto);
  }

  @Delete(':id')
  async deleteSubscription(
    @Request() req,
    @Param('id') subscriptionId: string
  ): Promise<{ message: string }> {
    await this.subscriptionsService.deleteSubscription(req.user.userId, subscriptionId);
    return { message: 'Subscription deleted successfully' };
  }

  // Simplified follow/unfollow for authors
  @Post('follow/author/:authorId')
  async followAuthor(
    @Request() req,
    @Param('authorId') authorId: string
  ): Promise<Subscription> {
    return await this.subscriptionsService.createSubscription(req.user.userId, {
      type: 'author',
      targetId: authorId,
      frequency: 'instant'
    });
  }

  @Delete('follow/author/:authorId')
  async unfollowAuthor(
    @Request() req,
    @Param('authorId') authorId: string
  ): Promise<{ message: string }> {
    await this.subscriptionsService.deleteSubscriptionByTarget(req.user.userId, 'author', authorId);
    return { message: 'Unfollowed successfully' };
  }

  // Check if following an author
  @Get('check/author/:authorId')
  async checkFollowingAuthor(
    @Request() req,
    @Param('authorId') authorId: string
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.subscriptionsService.isSubscribed(req.user.userId, 'author', authorId);
    return { isFollowing };
  }

  // Get follower count for an author
  @Get('followers/author/:authorId')
  async getFollowerCount(
    @Param('authorId') authorId: string
  ): Promise<{ count: number }> {
    const count = await this.subscriptionsService.getFollowerCount(authorId);
    return { count };
  }

  // Subscribe to category
  @Post('follow/category/:categoryId')
  async subscribeToCategory(
    @Request() req,
    @Param('categoryId') categoryId: string
  ): Promise<Subscription> {
    return await this.subscriptionsService.createSubscription(req.user.userId, {
      type: 'category',
      targetId: categoryId,
      frequency: 'instant'
    });
  }

  @Delete('follow/category/:categoryId')
  async unsubscribeFromCategory(
    @Request() req,
    @Param('categoryId') categoryId: string
  ): Promise<{ message: string }> {
    await this.subscriptionsService.deleteSubscriptionByTarget(req.user.userId, 'category', categoryId);
    return { message: 'Unsubscribed successfully' };
  }

  // Admin endpoint to manually trigger notification processing
  @Post('admin/process-notifications')
  @UseGuards(RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  async processNotifications(): Promise<{ message: string; processed: number }> {
    await this.notificationService.processNotificationQueue();
    return { message: 'Notification queue processed', processed: 0 };
  }

  // Check if subscribed to category
  @Get('check/category/:categoryId')
  async checkCategorySubscription(
    @Request() req,
    @Param('categoryId') categoryId: string
  ): Promise<{ isSubscribed: boolean }> {
    const isSubscribed = await this.subscriptionsService.isSubscribed(req.user.userId, 'category', categoryId);
    return { isSubscribed };
  }
}
