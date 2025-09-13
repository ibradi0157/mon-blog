"use client";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getArticle,
  updateArticle,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  uploadCover,
  removeCover,
  uploadContentImage,
  listCategories,
  type Category,
} from "@/app/services/articles";
import { getArticleStats } from "@/app/services/stats";
import { RichTextEditor } from "@/app/components/RichTextEditor";
import { useAuth } from "@/app/providers/AuthProvider";
import { useMemberArticleEdit } from "@/app/member/articles/hooks/useMemberArticleEdit";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { user } = useAuth();
  useEffect(() => {
    if (user && user.role !== "MEMBER") router.replace("/member");
  }, [user, router]);
  if (!user || user.role !== "MEMBER") {
    return null;
  }

  const articleQ = useQuery({ queryKey: ["article", id], queryFn: () => getArticle(id) });
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const statsQ = useQuery({ queryKey: ["article-stats", id], queryFn: () => getArticleStats(id) });

  const edit = useMemberArticleEdit({ id, article: ((articleQ.data as any)?.data ?? (articleQ.data as any)) });
  const mDelete = useMutation({
    mutationFn: () => deleteArticle(id),
    onSuccess: () => router.replace("/member/articles"),
  });

  const raw = articleQ.data as any;
  const a = raw?.data ?? raw;
  const isPublished = edit.isPublished;

  // Debounced server-side autosave for drafts (not published)
  useEffect(() => {
    // autosave handled by hook
  }, [edit, isPublished, a?.id]);

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Modifier l'article</h1>
        <div className="hidden sm:flex items-center gap-2">
          {isPublished ? (
            <Button variant="warning" size="sm" disabled={edit.unpublishing} onClick={() => edit.unpublish()}>Dépublier</Button>
          ) : (
            <Button variant="primary" size="sm" disabled={edit.publishing} onClick={() => edit.publish()}>Publier</Button>
          )}
          <Button variant="danger" size="sm" disabled={mDelete.isPending} onClick={() => { if (confirm("Supprimer cet article ?")) mDelete.mutate(); }}>Supprimer</Button>
        </div>
      </header>

      {articleQ.isLoading ? (
        <p>Chargement...</p>
      ) : articleQ.isError ? (
        <p className="text-red-600">Erreur: {(articleQ.error as any)?.message}</p>
      ) : !a ? (
        <p>Introuvable.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {isPublished && (
              <div className="px-3 py-2 rounded border border-yellow-500 text-yellow-800 bg-yellow-50">
                Cet article est publié. Dépubliez-le pour pouvoir le modifier.
              </div>
            )}
            {edit.errorMessage && (
              <div className="px-3 py-2 rounded border border-rose-500 text-rose-700 bg-rose-50">
                {edit.errorMessage}
              </div>
            )}
            <div className="space-y-3">
              <Input
                placeholder="Titre"
                value={edit.title}
                onChange={(e) => edit.setTitle(e.target.value)}
                disabled={isPublished}
              />
              <Select
                value={edit.categoryId}
                onChange={(e) => edit.setCategoryId(e.target.value)}
                disabled={isPublished}
              >
                <option value="">Aucune catégorie</option>
                {(cats.data?.data ?? []).map((c: Category) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Contenu</label>
              <RichTextEditor
                key={id}
                value={edit.content}
                onChange={edit.setContent}
                readOnly={isPublished}
                onImageUpload={isPublished ? undefined : edit.onImageUpload}
                className="min-h-[60vh] sm:min-h-[400px]"
                showWordCount
              />
            </div>
            {!isPublished && (
              <div className="flex items-center gap-3">
                <Button variant="primary" disabled={edit.updating} onClick={() => edit.updateNow()}>
                  Enregistrer
                </Button>
              </div>
            )}
            {/* errors surfaced above via edit.errorMessage */}
          </div>

          <aside className="space-y-4">
            <div className="border rounded p-3 space-y-2">
              <h3 className="font-medium">Couverture</h3>
              {a.coverUrl ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.coverUrl} alt="cover" className="w-full rounded" />
                  {!isPublished && (
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 rounded border cursor-pointer hover:bg-black/5">
                        Changer
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) edit.uploadCoverFile(f);
                          }}
                        />
                      </label>
                      <Button variant="outline" size="sm" onClick={() => edit.removeCoverFile()}>
                        Supprimer
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                !isPublished && (
                  <label className="px-3 py-1.5 rounded border cursor-pointer hover:bg-black/5 inline-block">
                    Téléverser une image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) edit.uploadCoverFile(f);
                      }}
                    />
                  </label>
                )
              )}
            </div>
            <div className="border rounded p-3 space-y-2">
              <h3 className="font-medium">Statistiques</h3>
              {statsQ.isLoading ? (
                <p>Chargement...</p>
              ) : statsQ.isError ? (
                <p className="text-red-600">Erreur</p>
              ) : (
                <ul className="text-sm space-y-1">
                  <li>Vues: {statsQ.data?.data?.views ?? 0}</li>
                  <li>Likes: {statsQ.data?.data?.likes ?? 0}</li>
                  <li>Dislikes: {statsQ.data?.data?.dislikes ?? 0}</li>
                  <li>Commentaires: {statsQ.data?.data?.commentsCount ?? 0}</li>
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
