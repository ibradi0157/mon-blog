"use client";

import { ClientArticleForm } from "../components/ClientArticleForm";
import { Suspense, useState, useEffect } from 'react';
import { LoadingSkeleton } from '@/app/components/LoadingSkeleton';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

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
  const router = useRouter();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Nouvel article</h1>
      </div>
      <ClientOnly>
        <ClientArticleForm />
      </ClientOnly>
    </div>
  );
}
