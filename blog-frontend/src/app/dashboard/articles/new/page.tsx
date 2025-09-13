"use client";

import { ClientArticleForm } from "../components/ClientArticleForm";
import { Suspense, useState, useEffect } from 'react';
import { LoadingSkeleton } from '@/app/components/LoadingSkeleton';

export const dynamic = 'force-dynamic';

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingSkeleton />;
  }

  return <>{children}</>;
}

export default function NewArticlePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nouvel article</h1>
      <ClientOnly>
        <ClientArticleForm />
      </ClientOnly>
    </div>
  );
}
