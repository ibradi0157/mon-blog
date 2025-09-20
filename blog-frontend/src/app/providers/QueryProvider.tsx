"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { logger } from "@/app/lib/logger";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1 },
      mutations: { retry: 0 },
    },
  }));

  // Dev-only: subscribe to cache events for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const unsubQuery = client.getQueryCache().subscribe((event) => {
      logger.debug('[rq:event]', event?.type, event);
    });
    const unsubMutation = client.getMutationCache().subscribe((event: any) => {
      logger.debug('[rq:mutation:event]', event?.type, event);
      const m = event?.mutation;
      const status = m?.state?.status;
      if (status === 'error') {
        const err: any = m?.state?.error;
        logger.warn('[rq:mutation:error]', { message: err?.message, status: err?.response?.status });
      }
    });
    return () => { unsubQuery?.(); unsubMutation?.(); };
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
