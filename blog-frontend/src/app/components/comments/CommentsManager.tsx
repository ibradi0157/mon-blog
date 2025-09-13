"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAdminComments,
  listMemberComments,
  deleteAdminComment,
  deleteComment,
  listReplies,
  listCommentReports,
  resolveCommentReport,
  type AdminComment,
  type CommentReport,
} from "@/app/services/comments";
import { listMyArticles, type Article } from "@/app/services/articles";
import { useAuth } from "@/app/providers/AuthProvider";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";

// Debounce hook
function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export type CommentsManagerProps = {
  mode?: "admin" | "member" | "auto";
};

export function CommentsManager({ mode = "auto" }: CommentsManagerProps) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const role = user?.role;
  const effectiveMode: "admin" | "member" = useMemo(() => {
    if (mode !== "auto") return mode;
    return role === "PRIMARY_ADMIN" || role === "SECONDARY_ADMIN" ? "admin" : "member";
  }, [mode, role]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [authorRole, setAuthorRole] = useState<string>("");
  const [articleId, setArticleId] = useState<string>("");
  const [details, setDetails] = useState<AdminComment | null>(null);
  const [view, setView] = useState<"list" | "grid">(() => {
    if (typeof window === "undefined") return "list";
    try {
      const key = `comments:view:${mode}`;
      return (localStorage.getItem(key) as any) || "list";
    } catch {
      return "list";
    }
  });
  useEffect(() => {
    try { localStorage.setItem(`comments:view:${mode}`, view); } catch {}
  }, [view, mode]);

  // Member article options
  const myArticlesQ = useQuery<{ success: boolean; data: Article[]; pagination: any } | undefined>({
    queryKey: ["my-articles", { page: 1, limit: 1000 }],
    queryFn: () => listMyArticles({ page: 1, limit: 1000 }),
    enabled: effectiveMode === "member",
    staleTime: 60_000,
  });
  const myArticles = useMemo(() => (effectiveMode === "member" ? (myArticlesQ.data?.data ?? []) : []), [effectiveMode, myArticlesQ.data?.data]);

  // Query comments
  const listQ = useQuery<{
    success: boolean;
    data: AdminComment[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }>({
    queryKey: [
      effectiveMode === "admin" ? "admin-comments" : "member-comments",
      { page, limit, search: debouncedSearch, order, authorRole: effectiveMode === "admin" ? authorRole : undefined, articleId: effectiveMode === "member" ? articleId : undefined },
    ],
    queryFn: () =>
      effectiveMode === "admin"
        ? listAdminComments({ page, limit, search: debouncedSearch || undefined, sort: "createdAt", order, authorRole: authorRole || undefined })
        : listMemberComments({ page, limit, search: debouncedSearch || undefined, sort: "createdAt", order, articleId: articleId || undefined }),
    placeholderData: (prev) => prev,
  });

  const comments = (listQ.data?.data ?? []) as AdminComment[];
  const pagination = listQ.data?.pagination ?? { page: 1, pages: 1, total: 0, limit };

  // Details drawer queries
  const repliesQ = useQuery({
    queryKey: ["comment-replies", { id: details?.id }],
    queryFn: () => listReplies(details!.id, { page: 1, limit: 20 }),
    enabled: !!details,
  });
  const reportsQ = useQuery<{ success: boolean; data: CommentReport[]; pagination: any }>({
    queryKey: ["comment-reports", { id: details?.id }],
    queryFn: () => listCommentReports({ status: "PENDING", page: 1, limit: 100 }),
    enabled: effectiveMode === "admin" && !!details,
  });

  // Delete mutation
  const delMut = useMutation({
    mutationFn: (id: string) => (effectiveMode === "admin" ? deleteAdminComment(id) : deleteComment(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: [effectiveMode === "admin" ? "admin-comments" : "member-comments"] }),
  });

  const resolveMut = useMutation({
    mutationFn: (vars: { reportId: string; action: "RESOLVED" | "DISMISSED" }) => resolveCommentReport(vars.reportId, vars.action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comment-reports"] });
      show("success", "Signalement mis à jour");
    },
    onError: (e: any) => show("error", e?.message || "Échec de l’action"),
  });

  // Notice
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const show = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 2500);
  };

  const loadingAny = listQ.isLoading || delMut.isPending;

  return (
    <div className="space-y-3">
      {notice && (
        <div className={`p-2 rounded text-sm ${notice.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>{notice.text}</div>
      )}

      {/* Controls */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={effectiveMode === "admin" ? "Rechercher par contenu, auteur ou article..." : "Rechercher dans mes commentaires..."}
            className="flex-1 min-w-[220px]"
          />
          {effectiveMode === "admin" && (
            <Select
              className="text-sm"
              value={authorRole}
              onChange={(e) => {
                setAuthorRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous les rôles</option>
              <option value="MEMBER">Membre</option>
              <option value="SECONDARY_ADMIN">Admin secondaire</option>
              <option value="PRIMARY_ADMIN">Admin principal</option>
            </Select>
          )}
          {effectiveMode === "member" && (
            <Select
              className="text-sm"
              value={articleId}
              onChange={(e) => {
                setArticleId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous mes articles</option>
              {myArticles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </Select>
          )}
          <Select
            className="text-sm"
            value={order}
            onChange={(e) => {
              setOrder(e.target.value as "ASC" | "DESC");
              setPage(1);
            }}
          >
            <option value="DESC">Plus récents</option>
            <option value="ASC">Plus anciens</option>
          </Select>
          <Select
            className="text-sm"
            value={String(limit)}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
          </Select>
          {listQ.isFetching && !listQ.isPending && <span className="text-xs opacity-70">Mise à jour…</span>}
          <div className="hidden sm:flex items-center gap-1 ml-auto">
            <Button variant={view === "list" ? "secondary" : "outline"} size="sm" onClick={() => setView("list")}>Liste</Button>
            <Button variant={view === "grid" ? "secondary" : "outline"} size="sm" onClick={() => setView("grid")}>Grille</Button>
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {listQ.isPending && Array.from({ length: limit }).map((_, i) => (
          <div key={`c-skel-${i}`} className="border rounded p-3 animate-pulse space-y-2">
            <div className="h-4 w-3/4 bg-black/10 dark:bg-white/10 rounded" />
            <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
            <div className="h-3 w-2/3 bg-black/10 dark:bg-white/10 rounded" />
          </div>
        ))}
        {!listQ.isPending && comments.map((c) => (
          <div key={c.id} className="border rounded p-3 space-y-2">
            <div className="text-sm whitespace-pre-wrap break-words line-clamp-4">{c.content}</div>
            <div className="flex items-center justify-between text-xs">
              <div className="truncate max-w-[60%]">{c.article?.title || "—"}</div>
              <div className="opacity-70">{c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs truncate max-w-[50%]">{c.author?.displayName || c.author?.email || "—"}</div>
              {c.authorTag ? <Badge variant="neutral">{c.authorTag}</Badge> : <span className="text-xs opacity-70">—</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {effectiveMode === "member" ? (
                <Link href={`/member/articles/${c.article?.id}/comments`} className="px-2 py-1 rounded border">Voir le fil</Link>
              ) : (
                <Link href={`/article/${c.article?.id}`} className="px-2 py-1 rounded border">Voir l’article</Link>
              )}
              <Button variant="outline" size="sm" onClick={() => setDetails(c)}>Détails</Button>
              <Button variant="danger" size="sm" disabled={loadingAny} onClick={() => { if (window.confirm("Supprimer ce commentaire ?")) delMut.mutate(c.id, { onSuccess: () => show("success", "Commentaire supprimé"), onError: (e: any) => show("error", e?.message || "Échec de la suppression") }); }}>Supprimer</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table (list) */}
      {view === "list" && (
      <div className="hidden sm:block overflow-auto border rounded dark:border-slate-700 max-h-[70vh]">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/10 text-left sticky top-0 z-10">
            <tr>
              <th className="p-2">Commentaire</th>
              <th className="p-2">Article</th>
              <th className="p-2">Auteur</th>
              <th className="p-2">Rôle</th>
              <th className="p-2">Créé le</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listQ.isPending &&
              Array.from({ length: limit }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-t dark:border-slate-700 align-top animate-pulse">
                  <td className="p-2">
                    <div className="h-4 w-64 bg-black/10 dark:bg-white/10 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-40 bg-black/10 dark:bg-white/10 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-20 bg-black/10 dark:bg-white/10 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-28 bg-black/10 dark:bg-white/10 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="h-8 w-24 bg-black/10 dark:bg-white/10 rounded" />
                  </td>
                </tr>
              ))}

            {!listQ.isPending &&
              comments.map((c) => (
                <tr key={c.id} className="border-t dark:border-slate-700 align-top">
                  <td className="p-2">
                    <div className="max-w-[40ch] line-clamp-3 whitespace-pre-wrap break-words">{c.content}</div>
                  </td>
                  <td className="p-2">
                    <div className="opacity-90">{c.article?.title || "—"}</div>
                  </td>
                  <td className="p-2">
                    <div className="font-medium">{c.author?.displayName || "—"}</div>
                    <div className="text-xs opacity-70">{c.author?.email}</div>
                  </td>
                  <td className="p-2">
                    {c.authorTag ? <Badge variant="neutral">{c.authorTag}</Badge> : <span className="text-xs opacity-70">—</span>}
                  </td>
                  <td className="p-2">
                    <div className="text-xs opacity-80">{c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}</div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {effectiveMode === "member" ? (
                        <Link
                          href={`/member/articles/${c.article?.id}/comments`}
                          className="px-2 py-1 rounded border hover:bg-black/5 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          Voir le fil
                        </Link>
                      ) : (
                        <Link
                          href={`/article/${c.article?.id}`}
                          className="px-2 py-1 rounded border hover:bg-black/5 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          Voir l’article
                        </Link>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setDetails(c)}>Détails</Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={loadingAny}
                        onClick={() => {
                          if (window.confirm("Supprimer ce commentaire ?"))
                            delMut.mutate(c.id, {
                              onSuccess: () => show("success", "Commentaire supprimé"),
                              onError: (e: any) => show("error", e?.message || "Échec de la suppression"),
                            });
                        }}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

            {!listQ.isPending && comments.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm">
                  <div className="max-w-prose mx-auto">
                    <p className="font-medium mb-1">Aucun commentaire trouvé</p>
                    <p className="opacity-70">Essayez d’ajuster la recherche{effectiveMode === "member" ? " ou de sélectionner un autre article." : "."}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Desktop: grid */}
      {view === "grid" && (
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {listQ.isPending && Array.from({ length: limit }).map((_, i) => (
            <div key={`cg-skel-${i}`} className="border rounded p-3 animate-pulse space-y-2">
              <div className="h-4 w-3/4 bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
            </div>
          ))}
          {!listQ.isPending && comments.map((c) => (
            <motion.div
              key={c.id}
              className="border rounded p-3 space-y-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            >
              <div className="line-clamp-4 whitespace-pre-wrap break-words text-sm">{c.content}</div>
              <div className="text-xs opacity-70">{c.article?.title || "—"}</div>
              <div className="flex items-center justify-between text-xs">
                <div className="truncate max-w-[60%]">{c.author?.displayName || c.author?.email || "—"}</div>
                {c.authorTag ? <Badge variant="neutral">{c.authorTag}</Badge> : <span className="text-xs opacity-70">—</span>}
              </div>
              <div className="text-xs opacity-70">{c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}</div>
              <div className="flex flex-wrap gap-2">
                {effectiveMode === "member" ? (
                  <Link href={`/member/articles/${c.article?.id}/comments`} className="px-2 py-1 rounded border">Voir le fil</Link>
                ) : (
                  <Link href={`/article/${c.article?.id}`} className="px-2 py-1 rounded border">Voir l’article</Link>
                )}
                <Button variant="outline" size="sm" onClick={() => setDetails(c)}>Détails</Button>
                <Button variant="danger" size="sm" disabled={loadingAny} onClick={() => { if (window.confirm("Supprimer ce commentaire ?")) delMut.mutate(c.id, { onSuccess: () => show("success", "Commentaire supprimé"), onError: (e: any) => show("error", e?.message || "Échec de la suppression") }); }}>Supprimer</Button>
              </div>
            </motion.div>
          ))}
          {!listQ.isPending && comments.length === 0 && (
            <div className="col-span-full p-4 text-sm opacity-70 text-center border rounded">Aucun commentaire trouvé.</div>
          )}
        </div>
      )}

      {/* Details Drawer */}
      {details && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetails(null)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 border-l dark:border-slate-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Détails du commentaire</h2>
              <Button variant="outline" size="sm" onClick={() => setDetails(null)}>Fermer</Button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs opacity-70">Publié le</div>
                <div className="text-sm">{details.createdAt ? new Date(details.createdAt).toLocaleString() : "—"}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Article</div>
                <div className="text-sm">
                  {effectiveMode === "member" ? (
                    <Link href={`/member/articles/${details.article?.id}/edit`} className="underline">{details.article?.title}</Link>
                  ) : (
                    <Link href={`/article/${details.article?.id}`} className="underline">{details.article?.title}</Link>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs opacity-70">Auteur</div>
                <div className="text-sm">{details.author?.displayName || details.author?.email || "—"} {details.authorTag && (<span className="text-xs ml-2 px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">{details.authorTag}</span>)}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Contenu</div>
                <div className="whitespace-pre-wrap break-words border rounded p-2 bg-black/5 dark:bg-white/5">{details.content}</div>
              </div>

              <div className="pt-2">
                <h3 className="font-medium mb-1">Réponses</h3>
                {repliesQ.isLoading ? (
                  <div className="text-sm opacity-70">Chargement…</div>
                ) : repliesQ.isError ? (
                  <div className="text-sm text-rose-600">Erreur de chargement des réponses</div>
                ) : (
                  <ul className="divide-y border rounded dark:border-slate-700">
                    {(repliesQ.data?.data ?? []).length === 0 && (
                      <li className="p-3 text-sm opacity-70">Aucune réponse</li>
                    )}
                    {(repliesQ.data?.data ?? []).map((r) => (
                      <li key={r.id} className="p-3">
                        <div className="text-xs opacity-70">{new Date(r.createdAt || "").toLocaleString()}</div>
                        <div className="text-sm">{r.author?.displayName || r.author?.email || "—"}</div>
                        <div className="text-sm opacity-90 whitespace-pre-wrap break-words">{r.content}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {effectiveMode === "admin" && (
                <div className="pt-2">
                  <h3 className="font-medium mb-1">Signalements (en attente)</h3>
                  {reportsQ.isLoading ? (
                    <div className="text-sm opacity-70">Chargement…</div>
                  ) : reportsQ.isError ? (
                    <div className="text-sm text-rose-600">Erreur de chargement des signalements</div>
                  ) : (
                    <ul className="divide-y border rounded dark:border-slate-700">
                      {((reportsQ.data?.data ?? []).filter((r) => r.comment?.id === details.id)).length === 0 && (
                        <li className="p-3 text-sm opacity-70">Aucun signalement en attente</li>
                      )}
                      {((reportsQ.data?.data ?? []).filter((r) => r.comment?.id === details.id)).map((rep) => (
                        <li key={rep.id} className="p-3 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs opacity-70">{new Date(rep.createdAt).toLocaleString()} • Par {rep.reporter?.displayName || rep.reporter?.email || "—"}</div>
                            <div className="text-sm">Raison: {rep.reason}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="px-2 py-1 rounded border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                              disabled={resolveMut.isPending}
                              onClick={() => resolveMut.mutate({ reportId: rep.id, action: "RESOLVED" })}
                            >
                              Résoudre
                            </button>
                            <button
                              className="px-2 py-1 rounded border border-slate-400 hover:bg-black/5 disabled:opacity-50"
                              disabled={resolveMut.isPending}
                              onClick={() => resolveMut.mutate({ reportId: rep.id, action: "DISMISSED" })}
                            >
                              Rejeter
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="opacity-70 text-gray-600 dark:text-slate-400">
          Page {pagination.page} / {pagination.pages} — {pagination.total} éléments
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Précédent
          </button>
          <button
            disabled={pagination.pages <= page}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
