"use client";
import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPublicSiteSettings } from "@/app/services/site-settings";

export type PublicSiteSettings = Awaited<ReturnType<typeof getPublicSiteSettings>>["data"];

type Ctx = {
  settings: PublicSiteSettings | null;
  refresh: () => void;
  isLoading: boolean;
};

const SiteSettingsContext = createContext<Ctx | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: getPublicSiteSettings,
    staleTime: 60_000, // 1 min
    gcTime: 5 * 60_000,
  });

  const value = useMemo<Ctx>(() => ({
    settings: query.data?.data ?? null,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["public-site-settings"] }),
    isLoading: query.isLoading,
  }), [query.data, query.isLoading, queryClient]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): Ctx {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return ctx;
}
