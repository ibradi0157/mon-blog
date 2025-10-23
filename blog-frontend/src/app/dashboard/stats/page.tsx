"use client";

import { useEffect, useMemo, useState } from "react";
import { listAdminArticles, type AdminArticlesListParams, type Article } from "../../services/articles";
import { getAdminArticlesStatsBulk, type AdminArticleStats } from "../../services/stats";
import { listUsers, type User } from "../../services/users";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Button as UIButton } from "@/app/components/ui/Button";

type Row = Article & { stats?: AdminArticleStats };

export default function DashboardStatsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "published" | "draft" | "unpublished">("");
  const [authorId, setAuthorId] = useState<string>("");
  const [sort, setSort] = useState<string>("createdAt");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

  const [authors, setAuthors] = useState<User[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(false);
  const [view, setView] = useState<"list" | "grid">(() => {
    if (typeof window === "undefined") return "list";
    try { return (localStorage.getItem("admin:stats:view") as any) || "list"; } catch { return "list"; }
  });
  useEffect(() => { try { localStorage.setItem("admin:stats:view", view); } catch {} }, [view]);

  const authorNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of authors) m.set(u.id, u.displayName || u.email);
    return m;
  }, [authors]);

  const hasFilters = useMemo(() => !!(search || status || authorId || sort || order !== "DESC"), [search, status, authorId, sort, order]);

  async function fetchAuthors() {
    setLoadingAuthors(true);
    try {
      const res = await listUsers({ page: 1, limit: 100, sort: "displayName", order: "ASC" });
      setAuthors(res.data);
    } catch (_) {
      // ignore
    } finally {
      setLoadingAuthors(false);
    }
  }

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const params: AdminArticlesListParams = {
        page,
        limit,
        search: search || undefined,
        status: (status || undefined) as any,
        authorId: authorId || undefined,
        sort: sort || undefined,
        order,
      };
      const res = await listAdminArticles(params);
      const articles = res.data as Article[];
      setPagination(res.pagination);

      const ids = articles.map((a) => a.id);
      let statsMap = new Map<string, AdminArticleStats>();
      if (ids.length) {
        const statsRes = await getAdminArticlesStatsBulk(ids);
        for (const s of statsRes.data) statsMap.set(s.id, s);
      }

      setRows(articles.map((a) => ({ ...a, stats: statsMap.get(a.id) })));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erreur lors du chargement");
      setRows([]);
      setPagination({ total: 0, page: 1, limit, pages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuthors();
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, authorId, sort, order]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchData();
  }

  function toggleSort(key: string) {
    if (sort === key) {
      setOrder((o) => (o === "ASC" ? "DESC" : "ASC"));
    } else {
      setSort(key);
      setOrder("DESC");
    }
  }

  function resetFilters() {
    setSearch("");
    setStatus("");
    setAuthorId("");
    setSort("createdAt");
    setOrder("DESC");
    setPage(1);
    fetchData();
  }

  function exportCSV() {
    const headers = [
      "Titre",
      "Statut",
      "Auteur",
      "Catégorie",
      "Créé le",
      "Vues",
      "Likes",
      "Dislikes",
      "Commentaires",
    ];
    const lines = rows.map((r) => [
      escapeCsv(r.title || ""),
      r.isPublished ? "Publié" : "Brouillon",
      escapeCsv(authorNameMap.get(r.authorId || "") || r.authorId || ""),
      escapeCsv(r.category?.name || ""),
      r.createdAt ? new Date(r.createdAt).toISOString() : "",
      String(r.stats?.views ?? 0),
      String(r.stats?.likes ?? 0),
      String(r.stats?.dislikes ?? 0),
      String(r.stats?.commentsCount ?? 0),
    ].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `articles_stats_page${pagination.page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeCsv(value: string) {
    if (/[",\n]/.test(value)) return '"' + value.replace(/"/g, '""') + '"';
    return value;
  }

  // Charts data for current page
  const chartData = useMemo(() => {
    const titles = rows.map((r) => r.title);
    const views = rows.map((r) => r.stats?.views ?? 0);
    const likes = rows.map((r) => r.stats?.likes ?? 0);
    const dislikes = rows.map((r) => r.stats?.dislikes ?? 0);
    const comments = rows.map((r) => r.stats?.commentsCount ?? 0);
    return { titles, views, likes, dislikes, comments, maxViews: Math.max(1, ...views), maxComments: Math.max(1, ...comments), maxReact: Math.max(1, ...likes.map((v, i) => v + (dislikes[i] ?? 0))) };
  }, [rows]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Statistiques des articles</h1>

      <div className="flex flex-col gap-3">
        <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Input
            className="w-full sm:max-w-md"
            placeholder="Rechercher par titre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" className="w-full sm:w-auto">Rechercher</Button>
          <Button type="button" variant="outline" onClick={resetFilters} className="w-full sm:w-auto">Réinitialiser</Button>
          <Button type="button" variant="outline" className="sm:ml-auto w-full sm:w-auto text-sm px-3 py-2" onClick={exportCSV}>Exporter CSV</Button>
          <div className="hidden sm:flex items-center gap-1">
            <UIButton variant={view === "list" ? "secondary" : "outline"} size="sm" onClick={() => setView("list")}>Liste</UIButton>
            <UIButton variant={view === "grid" ? "secondary" : "outline"} size="sm" onClick={() => setView("grid")}>Grille</UIButton>
          </div>
        </form>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
          <div className="w-full sm:w-auto sm:min-w-[180px]">
            <select 
              value={status} 
              onChange={(e) => { setStatus(e.target.value as any); setPage(1); }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="">Tous les statuts</option>
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
              <option value="unpublished">Dépublié</option>
            </select>
          </div>

          <div className="w-full sm:w-auto sm:min-w-[220px]">
            <select 
              value={authorId} 
              onChange={(e) => { setAuthorId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="">Tous les auteurs</option>
              {authors.map((u) => (
                <option key={u.id} value={u.id}>{u.displayName || u.email}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 sm:ml-auto">
            {loadingAuthors ? "Chargement auteurs…" : `${authors.length} auteurs`}
          </div>
        </div>
      </div>

      {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">{error}</div>}

      {/* Inline charts for current page */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="font-medium mb-2 text-slate-900 dark:text-white">Vues par article (page)</div>
          <div className="space-y-1">
            {rows.map((r, i) => (
              <div key={r.id} className="flex items-center gap-2">
                <div className="truncate text-xs w-1/2" title={r.title}>{r.title}</div>
                <div className="flex-1 bg-gray-100 dark:bg-slate-700 h-3 rounded overflow-hidden">
                  <div className="bg-blue-500 h-3 rounded transition-all duration-500" style={{ width: `${Math.round(((r.stats?.views ?? 0) / chartData.maxViews) * 100)}%` }} />
                </div>
                <div className="text-xs w-10 text-right">{r.stats?.views ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border rounded p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="font-medium mb-2 text-slate-900 dark:text-white">Likes vs Dislikes (page)</div>
          <div className="space-y-1">
            {rows.map((r) => {
              const like = r.stats?.likes ?? 0;
              const dislike = r.stats?.dislikes ?? 0;
              const total = Math.max(1, like + dislike);
              return (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="truncate text-xs w-1/2 text-slate-700 dark:text-slate-300" title={r.title}>{r.title}</div>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-3 rounded overflow-hidden flex">
                    <div className="bg-green-500 h-3 transition-all duration-500" style={{ width: `${Math.round((like / total) * 100)}%` }} />
                    <div className="bg-red-500 h-3 transition-all duration-500" style={{ width: `${Math.round((dislike / total) * 100)}%` }} />
                  </div>
                  <div className="text-xs w-16 text-right">{like}/{dislike}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border rounded p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="font-medium mb-2 text-slate-900 dark:text-white">Commentaires (page)</div>
          <div className="space-y-1">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <div className="truncate text-xs w-1/2" title={r.title}>{r.title}</div>
                <div className="flex-1 bg-gray-100 dark:bg-slate-700 h-3 rounded overflow-hidden">
                  <div className="bg-purple-500 h-3 rounded transition-all duration-500" style={{ width: `${Math.round(((r.stats?.commentsCount ?? 0) / chartData.maxComments) * 100)}%` }} />
                </div>
                <div className="text-xs w-10 text-right">{r.stats?.commentsCount ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={`s-skel-${i}`} className="border border-slate-200 dark:border-slate-700 rounded p-3 animate-pulse space-y-2 bg-white dark:bg-slate-800">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
        {!loading && rows.map((row) => (
          <div key={row.id} className="border border-slate-200 dark:border-slate-700 rounded p-3 space-y-2 bg-white dark:bg-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium line-clamp-2 text-slate-900 dark:text-white" title={row.title}>{row.title}</div>
              {row.isPublished ? <Badge variant="success">Publié</Badge> : <Badge variant="muted">Brouillon</Badge>}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">{row.category?.name || "—"} • {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Auteur: {authorNameMap.get(row.authorId || "") || row.authorId || "-"}</div>
            <div className="text-xs text-slate-700 dark:text-slate-300">Vues {row.stats?.views ?? 0} · 👍 {row.stats?.likes ?? 0} · 👎 {row.stats?.dislikes ?? 0} · 💬 {row.stats?.commentsCount ?? 0}</div>
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <div className="p-4 text-sm opacity-70 text-center border rounded">Aucun article</div>
        )}
      </div>

      {/* Desktop: list or grid */}
      {view === "list" ? (
        <div className="hidden sm:block overflow-x-auto border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr className="text-slate-700 dark:text-slate-300">
                <th className="text-left px-3 py-2">
                  <button className="font-medium hover:underline" onClick={() => toggleSort("title")}>
                    Titre{sort === "title" ? (order === "ASC" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th className="text-left px-3 py-2">Statut</th>
                <th className="text-left px-3 py-2">Auteur</th>
                <th className="text-left px-3 py-2">Catégorie</th>
                <th className="text-left px-3 py-2">
                  <button className="font-medium hover:underline" onClick={() => toggleSort("createdAt")}>
                    Créé le{sort === "createdAt" ? (order === "ASC" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th className="text-right px-3 py-2">
                  <button className="font-medium hover:underline" onClick={() => toggleSort("views")}>
                    Vues{sort === "views" ? (order === "ASC" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th className="text-right px-3 py-2">
                  <button className="font-medium hover:underline" onClick={() => toggleSort("likes")}>
                    Likes{sort === "likes" ? (order === "ASC" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th className="text-right px-3 py-2">
                  <button className="font-medium hover:underline" onClick={() => toggleSort("dislikes")}>
                    Dislikes{sort === "dislikes" ? (order === "ASC" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th className="text-right px-3 py-2">
                  <button className="font-medium hover:underline" onClick={() => toggleSort("commentsCount")}>
                    Commentaires{sort === "commentsCount" ? (order === "ASC" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-500 dark:text-slate-400">Chargement...</td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="px-3 py-2">
                      {row.isPublished ? <Badge variant="success">Publié</Badge> : <Badge variant="muted">Brouillon</Badge>}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{authorNameMap.get(row.authorId || "") || row.authorId || "-"}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.category?.name || "-"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</td>
                    <td className="px-3 py-2 text-right">{row.stats?.views ?? 0}</td>
                    <td className="px-3 py-2 text-right">{row.stats?.likes ?? 0}</td>
                    <td className="px-3 py-2 text-right">{row.stats?.dislikes ?? 0}</td>
                    <td className="px-3 py-2 text-right">{row.stats?.commentsCount ?? 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-500 dark:text-slate-400">Aucun article</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={`sg-skel-${i}`} className="border rounded p-3 animate-pulse space-y-2">
              <div className="h-4 w-3/4 bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
            </div>
          ))}
          {!loading && rows.map((row) => (
            <div key={row.id} className="border rounded p-3 space-y-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium line-clamp-2" title={row.title}>{row.title}</div>
                {row.isPublished ? <Badge variant="success">Publié</Badge> : <Badge variant="muted">Brouillon</Badge>}
              </div>
              <div className="text-xs opacity-80">{row.category?.name || "—"} • {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</div>
              <div className="text-xs opacity-80">Auteur: {authorNameMap.get(row.authorId || "") || row.authorId || "-"}</div>
              <div className="text-xs opacity-90">Vues {row.stats?.views ?? 0} · 👍 {row.stats?.likes ?? 0} · 👎 {row.stats?.dislikes ?? 0} · 💬 {row.stats?.commentsCount ?? 0}</div>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <div className="col-span-full p-4 text-sm opacity-70 text-center border rounded">Aucun article</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-slate-400">
          {pagination.total > 0 ? `Page ${pagination.page} / ${pagination.pages} — ${pagination.total} articles` : "Aucun résultat"}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
          <Button variant="outline" disabled={loading || page >= pagination.pages} onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}>Suivant</Button>
        </div>
      </div>
    </div>
  );
}
