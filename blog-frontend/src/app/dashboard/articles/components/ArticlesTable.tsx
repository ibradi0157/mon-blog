"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAdminArticles, publishArticle, unpublishArticle, deleteArticle, type Article } from "@/app/services/articles";
import { getAdminArticlesStatsBulk, type AdminArticleStats } from "@/app/services/stats";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { COVER_PLACEHOLDER } from "@/app/lib/placeholder";

// Debounce hook to limit search-triggered requests
function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function ArticlesTable() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "title" | "author">("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const limit = 10;
  const debouncedSearch = useDebouncedValue(search, 400);
  const [view, setView] = useState<"list" | "grid">(() => {
    if (typeof window === "undefined") return "list";
    try { return (localStorage.getItem("admin:articles:view") as any) || "list"; } catch { return "list"; }
  });
  useEffect(() => {
    try { localStorage.setItem("admin:articles:view", view); } catch {}
  }, [view]);

  const listQ = useQuery<{ success: boolean; data: Article[]; pagination: { total: number; page: number; limit: number; pages: number } }>({
    queryKey: ["admin-articles", { page, limit, search: debouncedSearch, status: statusFilter, sort: sortBy, order: sortOrder }],
    queryFn: () => listAdminArticles({ page, limit, search: debouncedSearch || undefined }),
    placeholderData: (prev) => prev,
  });
  
  const rawArticles = (listQ.data?.data ?? []) as Article[];
  
  // Filtrer et trier côté client (en attendant que le backend supporte ces paramètres)
  let filteredArticles = rawArticles;
  if (statusFilter === "published") {
    filteredArticles = filteredArticles.filter(a => a.isPublished);
  } else if (statusFilter === "draft") {
    filteredArticles = filteredArticles.filter(a => !a.isPublished);
  }
  
  // Tri côté client
  filteredArticles = [...filteredArticles].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "title") {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === "author") {
      const aAuthor = a.author?.displayName || "";
      const bAuthor = b.author?.displayName || "";
      comparison = aAuthor.localeCompare(bAuthor);
    } else { // createdAt
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      comparison = aDate - bDate;
    }
    return sortOrder === "ASC" ? comparison : -comparison;
  });
  const articles = filteredArticles;
  const pagination = listQ.data?.pagination ?? { page: 1, pages: 1, total: 0, limit };
  const isBgUpdating = listQ.isFetching && !listQ.isPending;

  // Batch fetch stats for all articles on the current page to avoid N+1 queries
  const ids = articles.map((a) => a.id);
  const statsQ = useQuery({
    queryKey: ["admin-articles-stats", ids],
    queryFn: () => getAdminArticlesStatsBulk(ids),
    enabled: articles.length > 0,
    placeholderData: (prev) => prev,
  });
  const statsMap = new Map((statsQ.data?.data ?? []).map((s: AdminArticleStats) => [s.id, s] as const));

  const show = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 2500);
  };

  const pubMut = useMutation({
    mutationFn: (id: string) => publishArticle(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["admin-articles"] });
      const prevLists = qc.getQueriesData<{ success: boolean; data: Article[]; pagination: { total: number; page: number; limit: number; pages: number } }>({ queryKey: ["admin-articles"] });
      prevLists.forEach(([key]) => {
        qc.setQueryData(key as any, (old: any) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.map((a: Article) => (a.id === id ? { ...a, isPublished: true } : a)) };
        });
      });
      return { prevLists } as { prevLists: [unknown, any][] };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prevLists?.forEach(([key, data]) => qc.setQueryData(key as any, data));
      show("error", "Échec de la publication");
    },
    onSuccess: () => {
      show("success", "Article publié");
    },
  });
  const unpubMut = useMutation({
    mutationFn: (id: string) => unpublishArticle(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["admin-articles"] });
      const prevLists = qc.getQueriesData<{ success: boolean; data: Article[]; pagination: { total: number; page: number; limit: number; pages: number } }>({ queryKey: ["admin-articles"] });
      prevLists.forEach(([key]) => {
        qc.setQueryData(key as any, (old: any) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.map((a: Article) => (a.id === id ? { ...a, isPublished: false } : a)) };
        });
      });
      return { prevLists } as { prevLists: [unknown, any][] };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prevLists?.forEach(([key, data]) => qc.setQueryData(key as any, data));
      show("error", "Échec de la dépublication");
    },
    onSuccess: () => {
      show("success", "Article dépublié");
    },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["admin-articles"] });
      const prevLists = qc.getQueriesData<{ success: boolean; data: Article[]; pagination: { total: number; page: number; limit: number; pages: number } }>({ queryKey: ["admin-articles"] });
      const prevStats = qc.getQueriesData<{ success: boolean; data: { id: string }[] }>({ queryKey: ["admin-articles-stats"] });
      // Optimistically remove the article from all cached admin-articles lists
      prevLists.forEach(([key]) => {
        qc.setQueryData(key as any, (old: any) => {
          if (!old?.data) return old;
          const had = old.data.some((a: Article) => a.id === id);
          const nextData = old.data.filter((a: Article) => a.id !== id);
          const nextPagination = old.pagination
            ? { ...old.pagination, total: Math.max(0, (old.pagination.total ?? nextData.length) - (had ? 1 : 0)) }
            : old.pagination;
          return { ...old, data: nextData, pagination: nextPagination };
        });
      });
      // Also remove stats for that id if present in any cached stats collections
      prevStats.forEach(([key]) => {
        qc.setQueryData(key as any, (old: any) => {
          if (!old?.data) return old;
          const nextData = old.data.filter((s: { id: string }) => s.id !== id);
          return { ...old, data: nextData };
        });
      });
      return { prevLists, prevStats } as { prevLists: [unknown, any][]; prevStats: [unknown, any][] };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prevLists?.forEach(([key, data]) => qc.setQueryData(key as any, data));
      ctx?.prevStats?.forEach(([key, data]) => qc.setQueryData(key as any, data));
      show("error", "Échec de la suppression");
    },
    onSuccess: () => {
      show("success", "Article supprimé");
    },
  });

  const confirmAndDelete = (id: string) => {
    if (window.confirm("Confirmer la suppression de cet article ? Cette action est irréversible.")) {
      delMut.mutate(id);
    }
  };

  return (
    <div className="space-y-3">
      {notice && (
        <div className={`p-2 rounded text-sm ${notice.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>{notice.text}</div>
      )}

      {listQ.isError && (
        <div className="p-2 rounded text-sm bg-rose-600 text-white flex items-center justify-between">
          <span>
            Erreur lors du chargement: {listQ.error instanceof Error ? listQ.error.message : "Une erreur est survenue"}
          </span>
          <button onClick={() => listQ.refetch()} className="px-2 py-1 rounded bg-white/20 hover:bg-white/30">Réessayer</button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par titre..."
            className="flex-1 min-w-[200px] max-w-md"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
          >
            <option value="createdAt">Trier par date</option>
            <option value="title">Trier par titre</option>
            <option value="author">Trier par auteur</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title={sortOrder === "ASC" ? "Croissant" : "Décroissant"}
          >
            {sortOrder === "ASC" ? "↑" : "↓"}
          </button>
          
          {isBgUpdating && (
            <span className="text-xs opacity-70">Mise à jour…</span>
          )}
          <div className="hidden sm:flex items-center gap-1">
            <Button variant={view === "list" ? "secondary" : "outline"} size="sm" onClick={() => setView("list")}>Liste</Button>
            <Button variant={view === "grid" ? "secondary" : "outline"} size="sm" onClick={() => setView("grid")}>Grille</Button>
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {listQ.isPending && (
          Array.from({ length: limit }).map((_, i) => (
            <div key={`m-skel-${i}`} className="border rounded p-3 animate-pulse space-y-2">
              <div className="h-4 w-3/4 bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-3 w-2/3 bg-black/10 dark:bg-white/10 rounded" />
            </div>
          ))
        )}
        {!listQ.isPending && articles.map((a) => {
          const s = statsMap.get(a.id);
          return (
            <div key={a.id} className="border rounded p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium line-clamp-2">{a.title}</div>
                  <div className="text-xs opacity-70 line-clamp-1">{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</div>
                </div>
                <div>
                  {a.isPublished ? (
                    <Badge variant="success">Publié</Badge>
                  ) : (
                    <Badge variant="muted">Brouillon</Badge>
                  )}
                </div>
              </div>
              <div className="text-xs opacity-80">
                {(statsQ.isPending || statsQ.isFetching) && !s ? (
                  <div className="h-3 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                ) : (
                  <>Vues: {s?.views ?? 0} · 👍 {s?.likes ?? 0} · 👎 {s?.dislikes ?? 0} · 💬 {s?.commentsCount ?? 0}</>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!a.isPublished ? (
                  <>
                    <Button variant="primary" size="sm" disabled={pubMut.isPending || delMut.isPending} onClick={() => pubMut.mutate(a.id)}>Publier</Button>
                    <Link href={`/dashboard/articles/${a.id}/edit`} className="px-2 py-1 rounded border">Modifier</Link>
                  </>
                ) : (
                  <>
                    <Button variant="warning" size="sm" disabled={unpubMut.isPending || delMut.isPending} onClick={() => unpubMut.mutate(a.id)}>Dépublier</Button>
                  </>
                )}
                <Button variant="danger" size="sm" disabled={delMut.isPending} onClick={() => confirmAndDelete(a.id)}>Supprimer</Button>
              </div>
            </div>
          );
        })}
        {!listQ.isPending && articles.length === 0 && (
          <div className="p-4 text-sm opacity-70 text-center border rounded">Aucun article trouvé.</div>
        )}
      </div>

      {/* Desktop: list or grid */}
      {view === "list" ? (
        <div className="hidden sm:block overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10 text-left">
              <tr>
                <th className="p-2">Titre</th>
                <th className="p-2">Auteur</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Créé le</th>
                <th className="p-2">Stats</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listQ.isPending && (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-t animate-pulse">
                    <td className="p-2 align-top"><div className="h-4 w-48 bg-black/10 dark:bg-white/10 rounded" /></td>
                    <td className="p-2 align-top"><div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded" /></td>
                    <td className="p-2 align-top"><div className="h-4 w-16 bg-black/10 dark:bg-white/10 rounded" /></td>
                    <td className="p-2 align-top"><div className="h-4 w-24 bg-black/10 dark:bg-white/10 rounded" /></td>
                    <td className="p-2 align-top"><div className="h-4 w-40 bg-black/10 dark:bg-white/10 rounded" /></td>
                    <td className="p-2 align-top"><div className="h-8 w-28 bg-black/10 dark:bg-white/10 rounded" /></td>
                  </tr>
                ))
              )}

              {!listQ.isPending && articles.map((a) => (
                <Row
                  key={a.id}
                  a={a}
                  stats={statsMap.get(a.id)}
                  onPublish={() => pubMut.mutate(a.id)}
                  onUnpublish={() => unpubMut.mutate(a.id)}
                  onDelete={() => confirmAndDelete(a.id)}
                  loading={pubMut.isPending || unpubMut.isPending || delMut.isPending}
                  statsLoading={statsQ.isPending || statsQ.isFetching}
                />
              ))}

              {!listQ.isPending && articles.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 opacity-70">Aucun article trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {listQ.isPending && (
            Array.from({ length: limit }).map((_, i) => (
              <div key={`g-skel-${i}`} className="border rounded overflow-hidden animate-pulse">
                <div className="h-32 bg-black/10 dark:bg-white/10" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-black/10 dark:bg-white/10 rounded" />
                  <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
                </div>
              </div>
            ))
          )}
          {!listQ.isPending && articles.map((a) => {
            const s = statsMap.get(a.id);
            return (
              <motion.div
                key={a.id}
                className="border rounded overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex flex-col"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.coverUrl || COVER_PLACEHOLDER} alt="cover" className="h-36 w-full object-cover" />
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium line-clamp-2" title={a.title}>{a.title}</div>
                    {a.isPublished ? <Badge variant="success">Publié</Badge> : <Badge variant="muted">Brouillon</Badge>}
                  </div>
                  <div className="text-xs opacity-70">{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</div>
                  <div className="text-xs opacity-80 mt-auto">
                    {statsQ.isPending && !s ? (
                      <div className="h-3 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                    ) : (
                      <>Vues: {s?.views ?? 0} · 👍 {s?.likes ?? 0} · 👎 {s?.dislikes ?? 0} · 💬 {s?.commentsCount ?? 0}</>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {!a.isPublished ? (
                      <>
                        <Button variant="primary" size="sm" disabled={pubMut.isPending || delMut.isPending} onClick={() => pubMut.mutate(a.id)}>Publier</Button>
                        <Link href={`/dashboard/articles/${a.id}/edit`} className="px-2 py-1 rounded border">Modifier</Link>
                      </>
                    ) : (
                      <>
                        <Button variant="warning" size="sm" disabled={unpubMut.isPending || delMut.isPending} onClick={() => unpubMut.mutate(a.id)}>Dépublier</Button>
                      </>
                    )}
                    <Button variant="danger" size="sm" disabled={delMut.isPending} onClick={() => confirmAndDelete(a.id)}>Supprimer</Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {!listQ.isPending && articles.length === 0 && (
            <div className="col-span-full p-4 text-sm opacity-70 text-center border rounded">Aucun article trouvé.</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="opacity-70">Page {pagination.page} / {pagination.pages} — {pagination.total} éléments</span>
        <div className="flex gap-2">
          <button disabled={page <= 1 || listQ.isPending} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Précédent</button>
          <button disabled={pagination.pages <= page || listQ.isPending} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Suivant</button>
        </div>
      </div>
    </div>
  );
}

function Row({ a, stats, onPublish, onUnpublish, onDelete, loading, statsLoading }: { a: Article; stats?: AdminArticleStats; onPublish: () => void; onUnpublish: () => void; onDelete: () => void; loading: boolean; statsLoading: boolean }) {
  const s = stats;
  return (
    <tr className="border-t">
      <td className="p-2 align-top">
        <div className="space-y-1">
          <div className="font-medium line-clamp-2">{a.title}</div>
          <div className="text-xs opacity-70 line-clamp-1">{a.coverUrl ?? "Pas de couverture"}</div>
        </div>
      </td>
      <td className="p-2 align-top">
        <div className="text-sm">
          {a.author?.displayName || <span className="opacity-50">Inconnu</span>}
        </div>
      </td>
      <td className="p-2 align-top">
        {a.isPublished ? (
          <Badge variant="success">Publié</Badge>
        ) : (
          <Badge variant="muted">Brouillon</Badge>
        )}
      </td>
      <td className="p-2 align-top">
        <div className="text-xs opacity-80">{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</div>
      </td>
      <td className="p-2 align-top">
        {statsLoading && !s ? (
          <div className="h-4 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        ) : (
          <div className="text-xs opacity-80">
            Vues: {s?.views ?? 0} · 👍 {s?.likes ?? 0} · 👎 {s?.dislikes ?? 0} · 💬 {s?.commentsCount ?? 0}
          </div>
        )}
      </td>
      <td className="p-2 align-top">
        <div className="flex flex-wrap gap-2 items-center">
          {!a.isPublished ? (
            <>
              <Button variant="primary" size="sm" disabled={loading} onClick={onPublish}>Publier</Button>
              <Link href={`/dashboard/articles/${a.id}/edit`} className="px-2 py-1 rounded border">Modifier</Link>
            </>
          ) : (
            <>
              <Button variant="warning" size="sm" disabled={loading} onClick={onUnpublish}>Dépublier</Button>
              <span className="text-xs opacity-60" title="Les articles publiés ne sont pas modifiables ici">—</span>
            </>
          )}
          <Button variant="danger" size="sm" disabled={loading} onClick={onDelete}>Supprimer</Button>
        </div>
      </td>
    </tr>
  );
}
