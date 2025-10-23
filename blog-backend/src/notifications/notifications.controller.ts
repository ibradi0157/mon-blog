// src/notifications/notifications.controller.ts
import { Controller, Get, Put, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.notificationsService.findAllForUser(
      req.user.userId,
      limit ? parseInt(limit.toString()) : 20,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Get('unread/count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.countUnreadForUser(req.user.userId);
    return { count };
  }

  @Put(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return await this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Put('read/all')
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    await this.notificationsService.deleteNotification(id, req.user.userId);
    return { message: 'Notification deleted' };
  }

  @Delete()
  async deleteAllNotifications(@Request() req) {
    await this.notificationsService.deleteAllForUser(req.user.userId);
    return { message: 'All notifications deleted' };
  }
}
