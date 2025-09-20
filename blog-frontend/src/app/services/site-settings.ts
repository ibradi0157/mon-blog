import { api } from "../lib/api";

export type SiteSettings = {
  id: string;
  siteName: string;
  siteDescription?: string;
  logoUrl?: string;
  faviconUrl?: string;
  defaultTheme: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  secondaryColor?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  twitterHandle?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  contactEmail?: string;
  socialFacebook?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  socialLinkedIn?: string;
  socialYoutube?: string;
  footerText?: string;
  showPoweredBy: boolean;
  homepageConfig?: any;
};

export type UpdateSiteSettingsPayload = Partial<Omit<SiteSettings, 'id' | 'createdAt' | 'updatedAt'>>;

export async function getPublicSiteSettings() {
  const { data } = await api.get("/site-settings");
  return data as { success: boolean; data: Partial<SiteSettings> };
}

export async function getAdminSiteSettings() {
  const { data } = await api.get("/site-settings/admin");
  return data as { success: boolean; data: SiteSettings };
}

export async function updateSiteSettings(payload: UpdateSiteSettingsPayload) {
  const { data } = await api.put("/site-settings/admin", payload);
  return data as { success: boolean; message: string; data: SiteSettings };
}

export async function uploadSiteLogo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.put("/site-settings/admin/logo", formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as { success: boolean; message: string; data: { logoUrl: string } };
}

export async function uploadSiteFavicon(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.put("/site-settings/admin/favicon", formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as { success: boolean; message: string; data: { faviconUrl: string } };
}
