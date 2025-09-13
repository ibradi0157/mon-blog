import { api } from "../lib/api";

export async function getArticleStats(articleId: string) {
  const { data } = await api.get(`/articles/${articleId}/stats`);
  return data as { success: boolean; data: { views: number; likes: number; dislikes: number; commentsCount: number } };
}

export async function viewArticle(articleId: string) {
  const { data } = await api.post(`/articles/${articleId}/stats/view`);
  return data as { success: boolean };
}

export async function likeArticle(articleId: string) {
  const { data } = await api.post(`/articles/${articleId}/stats/like`);
  return data as { success: boolean };
}

export async function dislikeArticle(articleId: string) {
  const { data } = await api.post(`/articles/${articleId}/stats/dislike`);
  return data as { success: boolean };
}

export type AdminArticleStats = {
  id: string;
  views: number;
  likes: number;
  dislikes: number;
  commentsCount: number;
};

export async function getAdminArticlesStatsBulk(ids: string[]) {
  if (!ids?.length) {
    return { success: true, data: [] as AdminArticleStats[] } as { success: boolean; data: AdminArticleStats[] };
  }
  const { data } = await api.get("/admin/articles/stats", { params: { ids: ids.join(",") } });
  return data as { success: boolean; data: AdminArticleStats[] };
}
