"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteAdminComment, listAdminComments, type AdminComment } from "@/app/services/comments";

// Debounce hook to reduce search-triggered requests
function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function CommentsTable() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const debouncedSearch = useDebouncedValue(search, 400);

  const show = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 2500);
  };

  const listQ = useQuery<{ success: boolean; data: AdminComment[]; pagination: { total: number; page: number; limit: number; pages: number } }>({
    queryKey: ["admin-comments", { page, limit, search: debouncedSearch }],
    queryFn: () => listAdminComments({ page, limit, search: debouncedSearch || undefined, sort: "createdAt", order: "DESC" }),
    placeholderData: (prev) => prev,
  });
  const comments = (listQ.data?.data ?? []) as AdminComment[];
  const pagination = listQ.data?.pagination ?? { page: 1, pages: 1, total: 0, limit };

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAdminComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
      show("success", "Commentaire supprimé");
    },
    onError: (e: any) => show("error", e?.message || "Échec de la suppression"),
  });

  const loadingAny = listQ.isLoading || delMut.isPending;

  return (
    <div className="space-y-3">
      {notice && (
        <div className={`p-2 rounded text-sm ${notice.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>{notice.text}</div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par contenu, auteur ou article..."
            className="px-3 py-2 border rounded flex-1 min-w-0 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
          />
          {listQ.isFetching && !listQ.isPending && (
            <span className="text-xs opacity-70">Mise à jour…</span>
          )}
        </div>
      </div>

      {/* Mobile cards (smaller screens) */}
      <div className="md:hidden space-y-3">
        {listQ.isPending
          ? Array.from({ length: limit }).map((_, i) => (
              <div key={`skeleton-card-${i}`} className="border rounded p-3 dark:border-slate-700 animate-pulse space-y-2">
                <div className="h-4 w-3/4 bg-black/10 dark:bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
                <div className="h-3 w-1/3 bg-black/10 dark:bg-white/10 rounded" />
                <div className="h-3 w-1/4 bg-black/10 dark:bg-white/10 rounded" />
                <div className="h-8 w-24 bg-black/10 dark:bg-white/10 rounded" />
              </div>
            ))
          : comments.length > 0
          ? comments.map((c) => (
              <div key={c.id} className="border rounded p-3 dark:border-slate-700">
                <div className="text-sm font-medium mb-1 line-clamp-4 whitespace-pre-wrap break-words">{c.content}</div>
                <div className="text-xs opacity-80 mb-1">
                  <span className="opacity-70">Article: </span>{c.article?.title || "—"}
                </div>
                <div className="text-xs opacity-80 mb-1">
                  <span className="opacity-70">Auteur: </span>{c.author?.displayName || "—"}
                  <span className="opacity-60"> ({c.author?.email || "—"})</span>
                </div>
                <div className="text-xs mb-2">
                  <span className="opacity-70">Rôle: </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">{c.authorTag || "—"}</span>
                </div>
                <div className="text-xs opacity-70 mb-3">{c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}</div>
                <div className="flex justify-end">
                  <button
                    disabled={loadingAny}
                    onClick={() => {
                      if (window.confirm("Supprimer ce commentaire ?")) delMut.mutate(c.id);
                    }}
                    className="px-2 py-1 rounded bg-rose-600 text-white disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          : (
              <div className="text-sm opacity-70">Aucun commentaire trouvé.</div>
            )}
      </div>

      {/* Table (md and up) */}
      <div className="hidden md:block overflow-x-auto border rounded dark:border-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/10 text-left">
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
            {listQ.isPending && (
              Array.from({ length: limit }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-t dark:border-slate-700 align-top animate-pulse">
                  <td className="p-2"><div className="h-4 w-64 bg-black/10 dark:bg-white/10 rounded" /></td>
                  <td className="p-2"><div className="h-4 w-40 bg-black/10 dark:bg-white/10 rounded" /></td>
                  <td className="p-2"><div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded" /></td>
                  <td className="p-2"><div className="h-4 w-20 bg-black/10 dark:bg-white/10 rounded" /></td>
                  <td className="p-2"><div className="h-4 w-28 bg-black/10 dark:bg-white/10 rounded" /></td>
                  <td className="p-2"><div className="h-8 w-24 bg-black/10 dark:bg-white/10 rounded" /></td>
                </tr>
              ))
            )}

            {!listQ.isPending && comments.map((c) => (
              <tr key={c.id} className="border-t dark:border-slate-700 align-top">
                <td className="p-2">
                  <div className="max-w-[40ch] line-clamp-3 whitespace-pre-wrap break-words">
                    {c.content}
                  </div>
                </td>
                <td className="p-2">
                  <div className="opacity-90">{c.article?.title || "—"}</div>
                </td>
                <td className="p-2">
                  <div className="font-medium">{c.author?.displayName || "—"}</div>
                  <div className="text-xs opacity-70">{c.author?.email}</div>
                </td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">{c.authorTag || "—"}</span>
                </td>
                <td className="p-2">
                  <div className="text-xs opacity-80">{c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}</div>
                </td>
                <td className="p-2">
                  <button
                    disabled={loadingAny}
                    onClick={() => {
                      if (window.confirm("Supprimer ce commentaire ?")) delMut.mutate(c.id);
                    }}
                    className="px-2 py-1 rounded bg-rose-600 text-white disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {!listQ.isPending && comments.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 opacity-70">Aucun commentaire trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="opacity-70 text-gray-600 dark:text-slate-400">Page {pagination.page} / {pagination.pages} — {pagination.total} éléments</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Précédent</button>
          <button disabled={pagination.pages <= page} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Suivant</button>
        </div>
      </div>
    </div>
  );
}
