"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listMyArticles,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  type Article,
} from "@/app/services/articles";
import { useAuth } from "@/app/providers/AuthProvider";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { COVER_PLACEHOLDER } from "@/app/lib/placeholder";

function useQP() {
  const router = useRouter();
  const sp = useSearchParams();
  const page = parseInt(sp.get("page") || "1");
  const limit = parseInt(sp.get("limit") || "10");
  const search = sp.get("search") || "";
  const status = sp.get("status") || "all"; // all | published | draft
  const set = (patch: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") params.delete(k);
      else params.set(k, String(v));
    });
    if (!("page" in patch)) params.set("page", "1"); // reset page on filters
    router.replace(`?${params.toString()}`);
  };
  return { page, limit, search, status, set };
}

export default function MemberArticlesPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <MemberArticlesPageClient />
    </Suspense>
  );
}

function MemberArticlesPageClient() {
  const qc = useQueryClient();
  const { page, limit, search, status, set } = useQP();

  const router = useRouter();
  const { user } = useAuth();
  const [view, setView] = useState<"list" | "grid">(() => {
    if (typeof window === "undefined") return "list";
    try { return (localStorage.getItem("member:articles:view") as any) || "list"; } catch { return "list"; }
  });
  useEffect(() => {
    try { localStorage.setItem("member:articles:view", view); } catch {}
  }, [view]);

  useEffect(() => {
    if (user && user.role !== "MEMBER") router.replace("/member");
  }, [user, router]);

  if (!user || user.role !== "MEMBER") {
    return null;
  }

  const isPublished = useMemo(
    () => (status === "published" ? true : status === "draft" ? false : undefined),
    [status]
  );

  const query = useQuery<{
    success: boolean;
    data: Article[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }>({
    queryKey: ["my-articles", user.id, { page, limit, search: search || undefined, isPublished }],
    queryFn: () => listMyArticles({ page, limit, search: search || undefined, isPublished }),
    placeholderData: (prev) => prev,
    enabled: !!user?.id,
  });

  // ✅ on garde seulement les articles de l’utilisateur connecté
  const items = (query.data?.data ?? []).filter((a) => a.authorId === user.id);

  const mPublish = useMutation({
    mutationFn: (id: string) => publishArticle(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["my-articles"] });
      const prevLists = qc.getQueriesData<{ success: boolean; data: Article[]; pagination: any }>({ queryKey: ["my-articles"] });
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
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["my-articles"] });
    },
  });
  const mUnpublish = useMutation({
    mutationFn: (id: string) => unpublishArticle(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["my-articles"] });
      const prevLists = qc.getQueriesData<{ success: boolean; data: Article[]; pagination: any }>({ queryKey: ["my-articles"] });
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
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["my-articles"] });
    },
  });
  const mDelete = useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-articles"] }),
  });

  useEffect(() => {
    // Prefetch next page
    if (query.data?.pagination?.page && query.data?.pagination?.pages) {
      const cur = query.data.pagination.page;
      const pages = query.data.pagination.pages;
      const next = cur + 1;
      if (next <= pages) {
        qc.prefetchQuery({
          queryKey: ["my-articles", user.id, { page: next, limit, search: search || undefined, isPublished }],
          queryFn: () => listMyArticles({ page: next, limit, search: search || undefined, isPublished }),
        });
      }
    }
  }, [query.data?.pagination?.page, query.data?.pagination?.pages, qc, limit, search, isPublished, user?.id]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes articles</h1>
        <Link
          href="/member/articles/new"
          className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:opacity-90"
        >
          + Nouvel article
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher..."
          className="min-w-[220px]"
          value={search}
          onChange={(e) => set({ search: e.target.value })}
        />
        <Select
          value={status}
          onChange={(e) => set({ status: e.target.value })}
        >
          <option value="all">Tous</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
        </Select>
        <Select
          value={String(limit)}
          onChange={(e) => set({ limit: Number(e.target.value) })}
        >
          <option value="5">5 / page</option>
          <option value="10">10 / page</option>
          <option value="20">20 / page</option>
        </Select>
        <div className="hidden sm:flex items-center gap-1 ml-auto">
          <Button variant={view === "list" ? "secondary" : "outline"} size="sm" onClick={() => setView("list")}>Liste</Button>
          <Button variant={view === "grid" ? "secondary" : "outline"} size="sm" onClick={() => setView("grid")}>Grille</Button>
        </div>
      </div>

      {query.isLoading ? (
        <p>Chargement...</p>
      ) : query.isError ? (
        <p className="text-red-600">
          Erreur: {(query.error as any)?.message || "Une erreur est survenue"}
        </p>
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="border rounded p-6 text-center text-sm text-gray-600 dark:text-gray-300">
              <p>
                Aucun de vos article disponible. Veuillez écrire vos premier article afin de
                les voir apparaitre ici.
              </p>
              <div className="mt-3">
                <Link
                  href="/member/articles/new"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:opacity-90"
                >
                  + Nouvel article
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile list stays the same */}
              <ul className="divide-y border rounded sm:hidden">
                {items.map((a: Article) => (
                  <li key={a.id} className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link href={a.isPublished ? `/article/${a.id}` : `/member/articles/${a.id}/edit`} className="font-medium hover:underline truncate">
                        {a.title}
                      </Link>
                      {a.isPublished ? <Badge variant="success">Publié</Badge> : <Badge variant="muted">Brouillon</Badge>}
                    </div>
                    <p className="text-sm opacity-70 truncate max-w-[60ch]">{a.content?.replace(/<[^>]+>/g, "").slice(0, 160)}</p>
                    {a.createdAt && (
                      <p className="text-xs opacity-60">
                        Publié le {new Date(a.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à {new Date(a.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {!a.isPublished && (
                        <Link href={`/member/articles/${a.id}/edit`} className="px-3 py-1.5 rounded border hover:bg-black/5">Modifier</Link>
                      )}
                      {a.isPublished && (
                        <Link href={`/article/${a.id}`} className="px-3 py-1.5 rounded border hover:bg-black/5" target="_blank">Voir</Link>
                      )}
                      {a.isPublished ? (
                        <Button variant="warning" size="sm" disabled={mUnpublish.isPending} onClick={() => mUnpublish.mutate(a.id)}>Dépublier</Button>
                      ) : (
                        <Button variant="primary" size="sm" disabled={mPublish.isPending} onClick={() => mPublish.mutate(a.id)}>Publier</Button>
                      )}
                      <Link href={`/member/articles/${a.id}/comments`} className="px-3 py-1.5 rounded border hover:bg-black/5">Commentaires</Link>
                      <Button variant="danger" size="sm" disabled={mDelete.isPending} onClick={() => { if (confirm("Supprimer cet article ?")) mDelete.mutate(a.id); }}>Supprimer</Button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: list or grid */}
              {view === "list" ? (
                <ul className="hidden sm:block divide-y border rounded">
                  {items.map((a: Article) => (
                    <li key={a.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={a.isPublished ? `/article/${a.id}` : `/member/articles/${a.id}/edit`} className="font-medium hover:underline truncate">
                            {a.title}
                          </Link>
                          {a.isPublished ? <Badge variant="success">Publié</Badge> : <Badge variant="muted">Brouillon</Badge>}
                        </div>
                        <p className="text-sm opacity-70 truncate max-w-[60ch]">{a.content?.replace(/<[^>]+>/g, "").slice(0, 160)}</p>
                        {a.createdAt && (
                          <p className="text-xs opacity-60">
                            Publié le {new Date(a.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à {new Date(a.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!a.isPublished && (
                          <Link href={`/member/articles/${a.id}/edit`} className="px-3 py-1.5 rounded border hover:bg-black/5">Modifier</Link>
                        )}
                        {a.isPublished && (
                          <Link href={`/article/${a.id}`} className="px-3 py-1.5 rounded border hover:bg-black/5" target="_blank">Voir</Link>
                        )}
                        {a.isPublished ? (
                          <Button variant="warning" size="sm" disabled={mUnpublish.isPending} onClick={() => mUnpublish.mutate(a.id)}>Dépublier</Button>
                        ) : (
                          <Button variant="primary" size="sm" disabled={mPublish.isPending} onClick={() => mPublish.mutate(a.id)}>Publier</Button>
                        )}
                        <Link href={`/member/articles/${a.id}/comments`} className="px-3 py-1.5 rounded border hover:bg-black/5">Commentaires</Link>
                        <Button variant="danger" size="sm" disabled={mDelete.isPending} onClick={() => { if (confirm("Supprimer cet article ?")) mDelete.mutate(a.id); }}>Supprimer</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((a: Article) => (
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
                          <Link href={a.isPublished ? `/article/${a.id}` : `/member/articles/${a.id}/edit`} className="font-medium hover:underline line-clamp-2" title={a.title}>{a.title}</Link>
                          {a.isPublished ? <Badge variant="success">Publié</Badge> : <Badge variant="muted">Brouillon</Badge>}
                        </div>
                        <p className="text-xs opacity-70 line-clamp-2">{a.content?.replace(/<[^>]+>/g, "").slice(0, 200)}</p>
                        {a.createdAt && (
                          <p className="text-xs opacity-60">
                            Publié le {new Date(a.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à {new Date(a.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-auto">
                          {!a.isPublished && (
                            <Link href={`/member/articles/${a.id}/edit`} className="px-2 py-1 rounded border">Modifier</Link>
                          )}
                          {a.isPublished && (
                            <Link href={`/article/${a.id}`} className="px-2 py-1 rounded border" target="_blank">Voir</Link>
                          )}
                          {a.isPublished ? (
                            <Button variant="warning" size="sm" disabled={mUnpublish.isPending} onClick={() => mUnpublish.mutate(a.id)}>Dépublier</Button>
                          ) : (
                            <Button variant="primary" size="sm" disabled={mPublish.isPending} onClick={() => mPublish.mutate(a.id)}>Publier</Button>
                          )}
                          <Link href={`/member/articles/${a.id}/comments`} className="px-2 py-1 rounded border">Commentaires</Link>
                          <Button variant="danger" size="sm" disabled={mDelete.isPending} onClick={() => { if (confirm("Supprimer cet article ?")) mDelete.mutate(a.id); }}>Supprimer</Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm opacity-70">
                  Page {query.data?.pagination?.page ?? 1} / {query.data?.pagination?.pages ?? 1}
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded border disabled:opacity-50" disabled={(query.data?.pagination?.page ?? 1) <= 1} onClick={() => set({ page: (query.data?.pagination?.page ?? 1) - 1 })}>Précédent</button>
                  <button className="px-3 py-1.5 rounded border disabled:opacity-50" disabled={(query.data?.pagination?.page ?? 1) >= (query.data?.pagination?.pages ?? 1)} onClick={() => set({ page: (query.data?.pagination?.page ?? 1) + 1 })}>Suivant</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
