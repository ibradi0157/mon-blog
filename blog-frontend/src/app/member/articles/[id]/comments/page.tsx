"use client";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listComments, deleteComment, type Comment } from "@/app/services/comments";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect } from "react";

function useQP() {
  const sp = useSearchParams();
  const router = useRouter();
  const page = parseInt(sp.get("page") || "1");
  const limit = parseInt(sp.get("limit") || "10");
  const set = (patch: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") params.delete(k);
      else params.set(k, String(v));
    });
    if (!("page" in patch)) params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };
  return { page, limit, set };
}

export default function ArticleCommentsPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <ArticleCommentsPageClient />
    </Suspense>
  );
}

function ArticleCommentsPageClient() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { page, limit, set } = useQP();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "MEMBER") router.replace("/member");
  }, [user, router]);
  if (!user || user.role !== "MEMBER") {
    return null;
  }

  const query = useQuery<{
    success: boolean;
    data: Comment[];
    pagination?: { total: number; page: number; limit: number; pages: number };
  }>({
    queryKey: ["article-comments", id, { page, limit }],
    queryFn: () => listComments(id, { page, limit }),
    placeholderData: (prev) => prev,
  });

  const mDelete = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["article-comments", id] }),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Commentaires</h1>
          <Link href={`/member/articles/${id}/edit`} className="text-sm text-blue-600 hover:underline">
            ← Retour à l'article
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 border rounded"
            value={String(limit)}
            onChange={(e) => set({ limit: Number(e.target.value) })}
          >
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
          </select>
        </div>
      </header>

      {query.isLoading ? (
        <p>Chargement...</p>
      ) : query.isError ? (
        <p className="text-red-600">Erreur: {(query.error as any)?.message || "Une erreur est survenue"}</p>
      ) : (
        <div className="space-y-4">
          <ul className="divide-y border rounded">
            {(query.data?.data ?? []).map((c: Comment) => (
              <li key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.author?.displayName || c.author?.email || c.authorTag || "Anonyme"}</p>
                  <p className="text-sm opacity-80 break-words">{c.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 rounded border border-red-600 text-red-700 hover:bg-red-50"
                    disabled={mDelete.isPending}
                    onClick={() => {
                      if (confirm("Supprimer ce commentaire ?")) mDelete.mutate(c.id);
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <div className="text-sm opacity-70">
              Page {query.data?.pagination?.page ?? 1} / {query.data?.pagination?.pages ?? 1}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded border disabled:opacity-50"
                disabled={(query.data?.pagination?.page ?? 1) <= 1}
                onClick={() => set({ page: (query.data?.pagination?.page ?? 1) - 1 })}
              >
                Précédent
              </button>
              <button
                className="px-3 py-1.5 rounded border disabled:opacity-50"
                disabled={(query.data?.pagination?.page ?? 1) >= (query.data?.pagination?.pages ?? 1)}
                onClick={() => set({ page: (query.data?.pagination?.page ?? 1) + 1 })}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
