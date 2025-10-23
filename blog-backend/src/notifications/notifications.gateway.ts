// src/notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.userId || payload.sub;

      if (!userId) {
        client.disconnect();
        return;
      }

      // Store userId in socket data
      client.data.userId = userId;

      // Track user's sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join user to their personal room
      client.join(`user:${userId}`);

      console.log(`Client connected: ${client.id}, User: ${userId}`);

      // Send unread count on connection
      const unreadCount = await this.notificationsService.countUnreadForUser(userId);
      client.emit('unread_count', { count: unreadCount });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    payload: { notificationId: string },
  ) {
    try {
      const userId = client.data.userId;
      await this.notificationsService.markAsRead(payload.notificationId, userId);
      
      // Send updated unread count
      const unreadCount = await this.notificationsService.countUnreadForUser(userId);
      client.emit('unread_count', { count: unreadCount });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('mark_all_as_read')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;
      await this.notificationsService.markAllAsRead(userId);
      
      client.emit('unread_count', { count: 0 });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @ConnectedSocket() client: Socket,
    payload: { limit?: number; offset?: number },
  ) {
    try {
      const userId = client.data.userId;
      const notifications = await this.notificationsService.findAllForUser(
        userId,
        payload.limit || 20,
        payload.offset || 0,
      );
      
      return { notifications };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Method to send notification to specific user
  async sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new_notification', notification);
    
    // Also send updated unread count
    const unreadCount = await this.notificationsService.countUnreadForUser(userId);
    this.server.to(`user:${userId}`).emit('unread_count', { count: unreadCount });
  }

  // Method to broadcast to all connected users
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
