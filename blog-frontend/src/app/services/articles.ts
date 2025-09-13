import { api } from "../lib/api";

export type Article = {
  id: string;
  title: string;
  content: string;
  coverUrl?: string | null;
  thumbnails?: string[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
  authorId?: string;
  authorRole?: string;
  category?: { id: string; name: string } | null;
  author?: { id: string; displayName: string; avatarUrl?: string | null } | null;
  likes?: number;
  dislikes?: number;
};

export async function listPublicArticles(params?: { page?: number; limit?: number; search?: string; sort?: 'createdAt' | 'likes' | 'dislikes'; order?: 'ASC' | 'DESC'; categoryId?: string }) {
  const { data } = await api.get("/articles/public", { params });
  return data as { success: boolean; data: Article[]; pagination: { total: number; page: number; limit: number; pages: number } };
}

export async function getPublicArticle(id: string) {
  const { data } = await api.get(`/articles/public/${id}`);
  return data as { success: boolean; data: Article };
}

export async function getArticle(id: string) {
  const { data } = await api.get(`/articles/${id}`);
  return data as { success: boolean; data: Article };
}

// Admin: fetch single article without ownership restrictions
export async function getAdminArticle(id: string) {
  const { data } = await api.get(`/admin/articles/${id}`);
  return data as { success: boolean; data: Article };
}

export type CreateArticlePayload = { title: string; content: string; isPublished?: boolean; categoryId?: string | null };
export async function createArticle(payload: CreateArticlePayload) {
  const { data } = await api.post("/articles", payload);
  return data as { success: boolean; data: Article };
}

export type UpdateArticlePayload = Partial<Article> & { categoryId?: string | null };
export async function updateArticle(id: string, changes: UpdateArticlePayload) {
  const { data } = await api.put(`/articles/${id}`, changes);
  return data as { success: boolean; data: Article };
}

export async function deleteArticle(id: string) {
  const { data } = await api.delete(`/articles/${id}`);
  return data as { success: boolean };
}

export async function publishArticle(id: string) {
  const { data } = await api.post(`/articles/${id}/publish`);
  return data as { success: boolean; data: Article };
}

export async function unpublishArticle(id: string) {
  const { data } = await api.post(`/articles/${id}/unpublish`);
  return data as { success: boolean; data: Article };
}

export async function uploadCover(id: string, file: File) {
  const form = new FormData();
  form.set("file", file);
  // Let the browser set Content-Type with proper boundary
  const { data } = await api.post(`/articles/${id}/cover`, form);
  return data as { success: boolean; data: { id: string; coverUrl: string; thumbnails: string[] } };
}

// Admin list-all with filters (requires admin auth via api interceptor)
export type AdminArticlesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "published" | "draft" | "unpublished";
  authorId?: string;
  sort?: string;
  order?: "ASC" | "DESC";
};
export async function listAdminArticles(params?: AdminArticlesListParams) {
  const { data } = await api.get("/admin/articles", { params });
  return data as { success: boolean; data: Article[]; pagination: { total: number; page: number; limit: number; pages: number } };
}

// Categories
export type Category = { id: string; name: string };
export async function listCategories() {
  const { data } = await api.get("/categories");
  return data as { success: boolean; data: Category[] };
}

// Admin: create/delete categories (requires admin auth via api interceptor)
export async function createCategory(name: string) {
  const { data } = await api.post("/categories", { name });
  return data as { success: boolean; data: Category };
}

export async function deleteCategory(id: string) {
  const { data } = await api.delete(`/categories/${id}`);
  return data as { success: boolean };
}

// Member-facing helpers
export type MyArticlesListParams = {
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "ASC" | "DESC";
};
export async function listMyArticles(params?: MyArticlesListParams) {
  const { data } = await api.get("/articles", { params });
  return data as { success: boolean; data: Article[]; pagination: { total: number; page: number; limit: number; pages: number } };
}

export async function removeCover(id: string) {
  const { data } = await api.delete(`/articles/${id}/cover`);
  return data as { success: boolean };
}

export async function uploadContentImage(id: string, file: File) {
  const form = new FormData();
  form.set("file", file);
  // Let the browser set Content-Type with proper boundary
  const { data } = await api.post(`/articles/${id}/images`, form);
  return data as { success: boolean; data: { url: string; thumbnails?: string[] } };
}

// Upload a content image without article ID (for new/draft before redirect to edit page)
export async function uploadGenericContentImage(file: File) {
  const form = new FormData();
  form.set("file", file);
  // Let the browser set Content-Type with proper boundary
  const { data } = await api.post(`/articles/upload-content-image`, form);
  return data as { success: boolean; data: { url: string; thumbnails?: string[] } };
}

export async function suggestPublicArticles(query: string, limit = 5) {
  if (!query || query.trim().length < 2) return [] as Article[];
  try {
    const res = await listPublicArticles({ search: query.trim(), limit });
    return res.data;
  } catch {
    return [] as Article[];
  }
}
