import { api } from "../lib/api";

export type LegalSlug = "privacy" | "terms";

export type LegalPage = {
  id: string;
  slug: LegalSlug;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

// Public
export async function getPublicLegal(slug: LegalSlug): Promise<LegalPage> {
  const { data } = await api.get(`/legal/${slug}`);
  return data;
}

// Admin
export async function adminListLegal(): Promise<LegalPage[]> {
  const { data } = await api.get("/admin/legal");
  return data;
}

export async function adminGetLegal(slug: LegalSlug): Promise<LegalPage> {
  const { data } = await api.get(`/admin/legal/${slug}`);
  return data;
}

export async function adminUpdateLegal(slug: LegalSlug, payload: { title: string; content: string }): Promise<LegalPage> {
  const { data } = await api.put(`/admin/legal/${slug}`, payload);
  return data;
}

export async function adminSetPublished(slug: LegalSlug, published: boolean): Promise<LegalPage> {
  const { data } = await api.patch(`/admin/legal/${slug}/publish`, { published });
  return data;
}
