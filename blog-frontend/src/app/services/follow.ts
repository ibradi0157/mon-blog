import { api } from '../lib/api';

export interface FollowStatus {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export interface FollowedUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  followedAt: string;
}

export async function followUser(userId: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/users/follow/${userId}`);
  return response.data;
}

export async function unfollowUser(userId: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/users/follow/${userId}`);
  return response.data;
}

export async function getFollowStatus(userId: string): Promise<FollowStatus> {
  const response = await api.get(`/users/follow/status/${userId}`);
  return response.data;
}

export async function getFollowing(): Promise<FollowedUser[]> {
  const response = await api.get('/users/follow/following');
  return response.data;
}

export async function getFollowers(userId: string): Promise<FollowedUser[]> {
  const response = await api.get(`/users/follow/followers/${userId}`);
  return response.data;
}
