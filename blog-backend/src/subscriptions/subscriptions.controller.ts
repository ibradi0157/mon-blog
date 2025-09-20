// src/subscriptions/subscriptions.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/create-subscription.dto';
import { Subscription } from './subscription.entity';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

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
}
