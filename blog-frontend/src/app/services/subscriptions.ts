// src/app/services/subscriptions.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Subscription {
  id: string;
  userId: string;
  type: 'category' | 'author' | 'all_articles';
  targetId?: string;
  frequency: 'instant' | 'daily' | 'weekly';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreateSubscriptionDto {
  type: 'category' | 'author' | 'all_articles';
  targetId?: string;
  frequency?: 'instant' | 'daily' | 'weekly';
}

export interface UpdateSubscriptionDto {
  frequency?: 'instant' | 'daily' | 'weekly';
  isActive?: boolean;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function getUserSubscriptions(): Promise<Subscription[]> {
  const response = await fetch(`${API_BASE_URL}/subscriptions`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subscriptions: ${response.statusText}`);
  }

  return response.json();
}

export async function createSubscription(subscriptionData: CreateSubscriptionDto): Promise<Subscription> {
  const response = await fetch(`${API_BASE_URL}/subscriptions`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to create subscription: ${response.statusText}`);
  }

  return response.json();
}

export async function updateSubscription(subscriptionId: string, updateData: UpdateSubscriptionDto): Promise<Subscription> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to update subscription: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteSubscription(subscriptionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to delete subscription: ${response.statusText}`);
  }
}
