import { api } from "../lib/api";

export type Comment = {
  id: string;
  content: string;
  articleId: string;
  createdAt?: string;
  authorId?: string;
  author?: CommentAuthor;
  authorTag?: string;
  likes?: number;
  dislikes?: number;
  parentId?: string | null;
};

export type CommentAuthor = {
  id: string;
  email: string;
  displayName?: string | null;
};

export type CommentArticle = {
  id: string;
  title: string;
};

export type AdminComment = {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  article: CommentArticle;
  authorTag?: string;
  likes?: number;
  dislikes?: number;
};

export type CommentsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "ASC" | "DESC";
  articleId?: string;
  authorId?: string;
  authorRole?: string;
};

export async function listComments(articleId: string, params?: { page?: number; limit?: number }) {
  const { data } = await api.get(`/comments/article/${articleId}`, { params });
  return data as { success: boolean; data: Comment[]; pagination?: any };
}

export async function createComment(articleId: string, content: string, parentId?: string) {
  const { data } = await api.post(`/comments`, { articleId, content, parentId });
  return data as { success: boolean; data: Comment };
}

export async function updateComment(id: string, content: string) {
  const { data } = await api.patch(`/comments/${id}`, { content });
  return data as { success: boolean; data: Comment };
}

export async function deleteComment(id: string) {
  const { data } = await api.delete(`/comments/${id}`);
  return data as { success: boolean };
}

export async function likeComment(articleId: string, commentId: string, isLike: boolean) {
  const { data } = await api.post(`/articles/${articleId}/like/comment/${commentId}`, { isLike });
  return data as { success: boolean; data: Comment };
}

export async function listAdminComments(params?: CommentsListParams) {
  const { data } = await api.get("/comments", { params });
  return data as {
    success: boolean;
    data: AdminComment[];
    pagination: { total: number; page: number; limit: number; pages: number };
  };
}

export async function deleteAdminComment(id: string) {
  const { data } = await api.delete(`/comments/${id}`);
  return data as { success: boolean };
}

// Replies
export async function listReplies(commentId: string, params?: { page?: number; limit?: number }) {
  const { data } = await api.get(`/comments/${commentId}/replies`, { params });
  return data as { success: boolean; data: Comment[]; pagination?: any };
}

// Reports
export type CommentReport = {
  id: string;
  reason: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  comment: Comment & { article?: CommentArticle };
  reporter: CommentAuthor;
};

export async function reportComment(commentId: string, reason: string) {
  const { data } = await api.post(`/comments/${commentId}/report`, { reason });
  return data as { success: boolean };
}

export async function listCommentReports(params?: { status?: "PENDING" | "RESOLVED" | "DISMISSED"; page?: number; limit?: number }) {
  const { data } = await api.get(`/comments/reports`, { params });
  return data as {
    success: boolean;
    data: CommentReport[];
    pagination: { total: number; page: number; limit: number; pages: number };
  };
}

export async function resolveCommentReport(reportId: string, action: "RESOLVED" | "DISMISSED") {
  const { data } = await api.patch(`/comments/reports/${reportId}/resolve`, { action });
  return data as { success: boolean };
}

// Member
export async function listMemberComments(params?: { page?: number; limit?: number; search?: string; sort?: string; order?: "ASC" | "DESC"; articleId?: string }) {
  const { data } = await api.get(`/comments/mine`, { params });
  return data as {
    success: boolean;
    data: (AdminComment & { article: CommentArticle })[];
    pagination: { total: number; page: number; limit: number; pages: number };
  };
}
