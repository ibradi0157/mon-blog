'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import type { Notification } from '../services/notifications';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const setupSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket connection
    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      
      // Request initial notifications
      socket.emit('get_notifications', { limit: 20 });
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Listen for new notifications
    socket.on('new_notification', (notification: Notification) => {
      console.log('🔔 New notification:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep max 50
      
      // Show toast
      toast.info(notification.title, {
        description: notification.message,
        action: notification.link ? {
          label: 'Voir',
          onClick: () => window.location.href = notification.link!,
        } : undefined,
      });
    });

    // Listen for unread count updates
    socket.on('unread_count', (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    // Handle notifications response
    socket.on('notifications', (data: { notifications: Notification[] }) => {
      setNotifications(data.notifications);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const cleanup = setupSocket();
    return cleanup;
  }, [setupSocket]);

  const markAsRead = useCallback((notificationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('mark_as_read', { notificationId });
      
      // Optimistically update UI
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('mark_all_as_read');
      
      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  }, []);

  const refreshNotifications = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('get_notifications', { limit: 20 });
    }
  }, []);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
