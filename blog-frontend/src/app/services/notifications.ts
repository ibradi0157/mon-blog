// src/app/services/notifications.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Notification {
  id: string;
  userId: string;
  type: 'article_published' | 'comment_added' | 'comment_reply' | 'like_received' | 'follow' | 'mention';
  title: string;
  message: string;
  link?: string;
  payload?: any;
  isRead: boolean;
  createdAt: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function getNotifications(limit: number = 20, offset: number = 0): Promise<Notification[]> {
  const response = await fetch(`${API_BASE_URL}/notifications?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }

  return response.json();
}

export async function getUnreadCount(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/notifications/unread/count`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.count;
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.statusText}`);
  }

  return response.json();
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/read/all`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete notification: ${response.statusText}`);
  }
}

export async function deleteAllNotifications(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete all notifications: ${response.statusText}`);
  }
}
