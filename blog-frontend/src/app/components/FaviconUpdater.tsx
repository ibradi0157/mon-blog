"use client";
import { useEffect } from "react";
import { useSiteSettings } from "@/app/providers/SiteSettingsProvider";
import { toAbsoluteImageUrl } from "@/app/lib/api";

export function FaviconUpdater() {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    // Update favicon
    try {
      const linkId = "dynamic-favicon";
      let link = document.head.querySelector<HTMLLinkElement>(`link#${linkId}`);
      if (!link) {
        link = document.createElement("link");
        link.id = linkId;
        link.rel = "icon";
        document.head.appendChild(link);
      }
      const href = settings.faviconUrl ? (toAbsoluteImageUrl(settings.faviconUrl) || settings.faviconUrl) : undefined;
      if (href) link.href = href;
    } catch {}

    // Optionally update document title prefix
    try {
      if (settings.siteName) {
        // Keep current title suffix if present
        const current = document.title || "";
        const sep = current.includes("|") ? "|" : "-";
        const parts = current.split(/\||\-/).map((p) => p.trim()).filter(Boolean);
        if (parts.length > 1) {
          parts[parts.length - 1] = settings.siteName;
          document.title = parts.join(` ${sep} `);
        } else if (parts.length === 1) {
          document.title = `${parts[0]} ${sep} ${settings.siteName}`;
        } else {
          document.title = settings.siteName;
        }
      }
    } catch {}
  }, [settings?.faviconUrl, settings?.siteName]);

  return null;
}
