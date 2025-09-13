"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCommentReports, resolveCommentReport, type CommentReport } from "@/app/services/comments";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";

export function CommentReportsTable() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"PENDING" | "RESOLVED" | "DISMISSED" | "">("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [view, setView] = useState<"list" | "grid">(() => {
    if (typeof window === "undefined") return "list";
    try { return (localStorage.getItem("admin:comment-reports:view") as any) || "list"; } catch { return "list"; }
  });
  useEffect(() => { try { localStorage.setItem("admin:comment-reports:view", view); } catch {} }, [view]);

  const show = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 2500);
  };

  const listQ = useQuery<{ success: boolean; data: CommentReport[]; pagination: { total: number; page: number; limit: number; pages: number } }>({
    queryKey: ["comment-reports", { status, page, limit }],
    queryFn: () => listCommentReports({ status: (status || undefined) as any, page, limit }),
    placeholderData: (prev) => prev,
  });
  const reports = (listQ.data?.data ?? []) as CommentReport[];
  const pagination = listQ.data?.pagination ?? { page: 1, pages: 1, total: 0, limit };

  const resolveMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "RESOLVED" | "DISMISSED" }) => resolveCommentReport(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comment-reports"] });
      show("success", "Signalement mis à jour");
    },
    onError: (e: any) => show("error", e?.message || "Échec de la mise à jour"),
  });

  const loadingAny = listQ.isLoading || resolveMut.isPending;

  return (
    <div className="space-y-3">
      {notice && (
        <div className={`p-2 rounded text-sm ${notice.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>{notice.text}</div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-sm opacity-80">Statut</label>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as any);
            setPage(1);
          }}
          className="text-sm"
        >
          <option value="">Tous</option>
          <option value="PENDING">En attente</option>
          <option value="RESOLVED">Résolus</option>
          <option value="DISMISSED">Rejetés</option>
        </Select>
        <div className="hidden sm:flex items-center gap-1 ml-auto">
          <Button variant={view === "list" ? "secondary" : "outline"} size="sm" onClick={() => setView("list")}>Liste</Button>
          <Button variant={view === "grid" ? "secondary" : "outline"} size="sm" onClick={() => setView("grid")}>Grille</Button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {listQ.isPending && Array.from({ length: limit }).map((_, i) => (
          <div key={`cr-skel-${i}`} className="border rounded p-3 animate-pulse space-y-2">
            <div className="h-4 w-3/4 bg-black/10 dark:bg-white/10 rounded" />
            <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
          </div>
        ))}
        {!listQ.isPending && reports.map((r) => (
          <div key={r.id} className="border rounded p-3 space-y-2 transition-all duration-200 hover:shadow-md">
            <div className="text-sm whitespace-pre-wrap break-words line-clamp-4">{r.comment?.content}</div>
            <div className="flex items-center justify-between text-xs">
              <div className="truncate max-w-[60%]">{(r.comment as any)?.article?.title || "—"}</div>
              <div className="opacity-70">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="truncate max-w-[50%]">{r.comment?.author?.displayName || r.comment?.author?.email || "—"}</div>
              <div className="truncate max-w-[40%]">{r.reporter?.displayName || r.reporter?.email || "—"}</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="opacity-80">Raison:</div>
              <div className="opacity-90">{r.reason}</div>
            </div>
            <div className="flex items-center justify-between">
              {r.status === "PENDING" && <Badge variant="warning">En attente</Badge>}
              {r.status === "RESOLVED" && <Badge variant="success">Résolu</Badge>}
              {r.status === "DISMISSED" && <Badge variant="muted">Rejeté</Badge>}
              <div className="flex gap-2">
                <Button variant="primary" size="sm" disabled={loadingAny || r.status !== "PENDING"} onClick={() => resolveMut.mutate({ id: r.id, action: "RESOLVED" })}>Valider</Button>
                <Button variant="danger" size="sm" disabled={loadingAny || r.status !== "PENDING"} onClick={() => resolveMut.mutate({ id: r.id, action: "DISMISSED" })}>Rejeter</Button>
              </div>
            </div>
          </div>
        ))}
        {!listQ.isPending && reports.length === 0 && (
          <div className="p-4 text-sm opacity-70 text-center border rounded">Aucun signalement</div>
        )}
      </div>

      {/* Desktop: list or grid */}
      {view === "list" ? (
        <div className="hidden sm:block overflow-x-auto border rounded dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10 text-left">
              <tr>
                <th className="p-2">Commentaire</th>
                <th className="p-2">Article</th>
                <th className="p-2">Auteur du commentaire</th>
                <th className="p-2">Signalé par</th>
                <th className="p-2">Raison</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Créé le</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t dark:border-slate-700 align-top">
                  <td className="p-2">
                    <div className="max-w-[40ch] line-clamp-3 whitespace-pre-wrap break-words">{r.comment?.content}</div>
                  </td>
                  <td className="p-2">{(r.comment as any)?.article?.title || "—"}</td>
                  <td className="p-2">
                    <div className="font-medium">{r.comment?.author?.displayName || r.comment?.author?.email || "—"}</div>
                  </td>
                  <td className="p-2">
                    <div className="font-medium">{r.reporter?.displayName || r.reporter?.email || "—"}</div>
                  </td>
                  <td className="p-2">{r.reason}</td>
                  <td className="p-2">
                    {r.status === "PENDING" && <Badge variant="warning">En attente</Badge>}
                    {r.status === "RESOLVED" && <Badge variant="success">Résolu</Badge>}
                    {r.status === "DISMISSED" && <Badge variant="muted">Rejeté</Badge>}
                  </td>
                  <td className="p-2">
                    <div className="text-xs opacity-80">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</div>
                  </td>
                  <td className="p-2 space-x-2">
                    <Button variant="primary" size="sm" disabled={loadingAny || r.status !== "PENDING"} onClick={() => resolveMut.mutate({ id: r.id, action: "RESOLVED" })}>Valider</Button>
                    <Button variant="danger" size="sm" disabled={loadingAny || r.status !== "PENDING"} onClick={() => resolveMut.mutate({ id: r.id, action: "DISMISSED" })}>Rejeter</Button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 opacity-70">Aucun signalement</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r) => (
            <div key={r.id} className="border rounded p-3 space-y-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="line-clamp-4 whitespace-pre-wrap break-words text-sm">{r.comment?.content}</div>
              <div className="text-xs opacity-70">Article: {(r.comment as any)?.article?.title || "—"}</div>
              <div className="flex items-center justify-between text-xs">
                <div className="truncate max-w-[45%]">Auteur: {r.comment?.author?.displayName || r.comment?.author?.email || "—"}</div>
                <div className="truncate max-w-[45%]">Par: {r.reporter?.displayName || r.reporter?.email || "—"}</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="opacity-80">Raison:</div>
                <div className="opacity-90">{r.reason}</div>
              </div>
              <div className="flex items-center justify-between">
                {r.status === "PENDING" && <Badge variant="warning">En attente</Badge>}
                {r.status === "RESOLVED" && <Badge variant="success">Résolu</Badge>}
                {r.status === "DISMISSED" && <Badge variant="muted">Rejeté</Badge>}
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" disabled={loadingAny || r.status !== "PENDING"} onClick={() => resolveMut.mutate({ id: r.id, action: "RESOLVED" })}>Valider</Button>
                  <Button variant="danger" size="sm" disabled={loadingAny || r.status !== "PENDING"} onClick={() => resolveMut.mutate({ id: r.id, action: "DISMISSED" })}>Rejeter</Button>
                </div>
              </div>
              <div className="text-xs opacity-70">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</div>
            </div>
          ))}
          {reports.length === 0 && (
            <div className="col-span-full p-4 text-sm opacity-70 text-center border rounded">Aucun signalement</div>
          )}
        </div>
      )}

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
