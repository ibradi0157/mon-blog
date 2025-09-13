"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { listCategories, listPublicArticles, type Article, type Category } from "../services/articles";
import { buildSrcSet, toAbsoluteImageUrl } from "../lib/api";
import { Search, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Calendar, Filter, BookOpen } from "lucide-react";

export default function ArticlesPage() {
  return (
    <Suspense fallback={<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><div className="h-10" /></main>}>
      <ArticlesPageClient />
    </Suspense>
  );
}

function ArticlesPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; pages: number }>({ total: 0, page: 1, limit: 12, pages: 0 });
  const [categories, setCategories] = useState<Category[]>([]);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 12);
  const search = searchParams.get("search") ?? "";
  const sort = (searchParams.get("sort") as 'createdAt' | 'likes' | 'dislikes' | null) ?? 'createdAt';
  const order = (searchParams.get("order") as 'ASC' | 'DESC' | null) ?? 'DESC';
  const categoryId = searchParams.get("categoryId") ?? "";

  useEffect(() => {
    let mounted = true;
    // load categories once
    listCategories().then((res) => {
      if (!mounted) return;
      setCategories(res.data);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    listPublicArticles({ page, limit, search: search || undefined, sort: sort || undefined, order: order || undefined, categoryId: categoryId || undefined })
      .then((res) => {
        if (!mounted) return;
        setArticles(res.data);
        setPagination(res.pagination);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Échec du chargement");
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [page, limit, search, sort, order, categoryId]);

  function updateParams(next: Record<string, string | number | undefined | null>) {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") sp.delete(k);
      else sp.set(k, String(v));
    });
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tous les articles</h1>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => updateParams({ search: e.target.value, page: 1 })}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1"><Filter className="w-4 h-4"/>Catégorie</span>
          <select
            value={categoryId}
            onChange={(e) => updateParams({ categoryId: e.target.value || undefined, page: 1 })}
            className="flex-1 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value as any, page: 1 })}
            className="flex-1 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="createdAt">Par date</option>
            <option value="likes">Les plus likés</option>
            <option value="dislikes">Les plus dislikés</option>
          </select>
          <button
            onClick={() => updateParams({ order: order === 'ASC' ? 'DESC' : 'ASC', page: 1 })}
            className="inline-flex items-center gap-1 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            title="Ordre"
          >
            {order === 'ASC' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-sm">{order === 'ASC' ? 'Croissant' : 'Décroissant'}</span>
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 dark:border-slate-700 p-4 h-64 bg-slate-50/50 dark:bg-slate-800/30" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                disabled={pagination.page <= 1}
                onClick={() => updateParams({ page: Math.max(1, pagination.page - 1) })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-300">Page {pagination.page} / {pagination.pages}</span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => updateParams({ page: Math.min(pagination.pages, pagination.page + 1) })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const img = toAbsoluteImageUrl(article.coverUrl ?? undefined);
  const srcSet = buildSrcSet(article.thumbnails);
  return (
    <Link href={`/article/${article.id}`} className="group block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow bg-white dark:bg-slate-900">
      {img ? (
        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            srcSet={srcSet}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-white/80" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2">{article.title}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5" />
          <span>{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ''}</span>
          {article.category && (
            <>
              <span>•</span>
              <span>{article.category.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {article.likes ?? 0}</span>
          <span className="inline-flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5" /> {article.dislikes ?? 0}</span>
        </div>
      </div>
    </Link>
  );
}
