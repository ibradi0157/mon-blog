import { api } from "@/app/lib/api";

export interface LikedArticle {
  id: string;
  title: string;
  coverUrl?: string;
  author: {
    displayName: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export interface FollowedAuthor {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  articlesCount: number;
  followersCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const userPreferencesApi = {
  getLikedArticles(page = 1, limit = 10) {
    return api
      .get<PaginatedResponse<LikedArticle>>(`/user-preferences/liked-articles`, {
        params: { page, limit },
      })
      .then((res) => res.data);
  },

  getFollowedAuthors(page = 1, limit = 10) {
    return api
      .get<PaginatedResponse<FollowedAuthor>>(`/user-preferences/followed-authors`, {
        params: { page, limit },
      })
      .then((res) => res.data);
  },
};