"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAdminArticle } from "@/app/services/articles";
import { ArticleForm } from "../../components/ArticleForm";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const q = useQuery({ queryKey: ["admin-article", id], queryFn: () => getAdminArticle(id), enabled: !!id });

  if (q.isLoading) return <div className="p-4">Chargement…</div>;
  if (q.isError || !q.data?.data) return <div className="p-4 text-rose-600">Erreur: impossible de charger l'article.</div>;

  const a = q.data.data;

  if (a.isPublished) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/articles"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Retour</span>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Éditer l'article</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Cet article est actuellement publié.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-300 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-4 md:p-5 transition-all duration-300">
          <p className="opacity-90 text-amber-800 dark:text-amber-200">Les articles publiés ne sont pas modifiables dans ce panneau. Dépubliez l'article depuis la liste pour pouvoir l'éditer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/articles"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Retour</span>
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Éditer l'article (brouillon)</h1>
      </div>
      <ArticleForm initial={a} onSuccess={() => router.push("/dashboard/articles")} />
    </div>
  );
}
