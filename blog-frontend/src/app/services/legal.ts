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
  // 404 is expected when a page is unpublished; suppress error-level logs to avoid noisy overlays in dev
  const { data } = await api.get(`/legal/${slug}`, {
    // Custom flags read by api interceptor in lib/api.ts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...( { _expectedStatuses: [404], _suppressErrorLog: true } as any ),
  });
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
