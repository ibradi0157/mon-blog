import { api } from "../lib/api";
import type { Article } from "./articles";

export type HeroSection = {
  kind: "hero";
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  text?: string | null;
  buttonLabel?: string | null;
  buttonHref?: string | null;
};

export type FeaturedGridSection = {
  kind: "featuredGrid";
  title?: string | null;
  articleIds: string[];
  // present on public payload after server resolution
  articles?: Article[];
};

export type HtmlSection = { kind: "html"; html: string };
export type SpacerSection = { kind: "spacer"; size: "sm" | "md" | "lg" };
export type CtaSection = {
  kind: "cta";
  title: string;
  text?: string | null;
  buttonLabel?: string | null;
  buttonHref?: string | null;
};

export type CategoryGridSection = {
  kind: "categoryGrid";
  title?: string | null;
  categoryIds: string[];
  // present on public payload after server resolution
  categories?: { id: string; name: string }[];
};

export type Section = HeroSection | FeaturedGridSection | CategoryGridSection | HtmlSection | SpacerSection | CtaSection;

export type HomepageConfig = {
  id?: string;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  featuredArticleIds: string[];
  sections?: Section[] | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function getPublicHomepage() {
  const { data } = await api.get("/homepage");
  return data as {
    success: boolean;
    data: {
      heroTitle: string | null;
      heroSubtitle: string | null;
      heroImageUrl: string | null;
      sections: Section[] | null;
      featuredArticles: Article[];
    };
  };
}

export async function getAdminHomepage() {
  const { data } = await api.get("/admin/homepage");
  return data as { success: boolean; data: HomepageConfig };
}

export async function updateAdminHomepage(payload: Partial<HomepageConfig>) {
  const { data } = await api.patch("/admin/homepage", payload);
  return data as { success: boolean; data: HomepageConfig };
}
