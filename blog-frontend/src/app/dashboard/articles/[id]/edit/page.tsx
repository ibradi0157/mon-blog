"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAdminArticle } from "@/app/services/articles";
import { ArticleForm } from "../../components/ArticleForm";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

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
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Éditer l’article</h1>
          <p className="opacity-80 text-sm">Cet article est actuellement publié.</p>
        </header>
        <div className="rounded-2xl border border-amber-300 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-4 md:p-5 transition-all duration-300">
          <p className="opacity-90 text-amber-800 dark:text-amber-200">Les articles publiés ne sont pas modifiables dans ce panneau. Dépubliez l’article depuis la liste pour pouvoir l’éditer.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dashboard/articles" className="px-3 py-2 rounded border">Retour à la liste</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">Éditer l’article (brouillon)</h1>
        <Link href="/dashboard/articles" className="px-3 py-2 rounded border">Retour</Link>
      </header>
      <ArticleForm initial={a} onSuccess={() => router.push("/dashboard/articles")} />
    </div>
  );
}
