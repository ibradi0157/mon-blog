"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createArticle, updateArticle, listCategories, type Category, uploadCover, uploadGenericContentImage } from "@/app/services/articles";
import { RichTextEditor } from "@/app/components/RichTextEditor";
import { useAuth } from "@/app/providers/AuthProvider";
import { toAbsoluteImageUrl } from "@/app/lib/api";

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | "">("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatingRef = useRef(false);
  const [serverId, setServerId] = useState<string | null>(null);

  const { user } = useAuth();
  useEffect(() => {
    if (user && user.role !== "MEMBER") router.replace("/member");
  }, [user, router]);
  if (!user || user.role !== "MEMBER") {
    return null;
  }

  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  // Draft key scoped by user id
  const draftKey = user?.id ? `draft:member:new-article:${user.id}` : "draft:member:new-article";

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(draftKey) : null;
      if (raw) {
        const d = JSON.parse(raw) as { title?: string; content?: string; categoryId?: string };
        if (d.title) setTitle(d.title);
        if (typeof d.categoryId === "string") setCategoryId(d.categoryId);
        if (d.content) setContent(d.content);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Autosave draft (debounced)
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ title, content, categoryId, updatedAt: Date.now() })
        );
      } catch {}
    }, 600);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content, categoryId, draftKey]);

  // Server-side autosave: create draft automatically once valid, then debounce updates
  const createSilent = useMutation({
    mutationFn: async () => {
      const res = await createArticle({ title, content, isPublished: false, categoryId: categoryId || undefined });
      return res as any;
    },
    onSuccess: async (res: any) => {
      const id = res?.data?.id as string | undefined;
      if (id) {
        setServerId(id);
        try { localStorage.removeItem(draftKey); } catch {}
        if (cover) {
          try { await uploadCover(id, cover); } catch {}
        }
      }
    }
  });

  const updateSilent = useMutation({
    mutationFn: async (id: string) => {
      await updateArticle(id, { title, content, categoryId: categoryId || null });
    }
  });

  useEffect(() => {
    const isTipTapEmpty = (content || "").trim() === '<p></p>';
    const canSubmit = title.trim().length >= 5 && content.trim().length > 0 && !isTipTapEmpty;
    // If valid and no server draft yet, create it once
    if (canSubmit && !serverId && !creatingRef.current && !createSilent.isPending) {
      creatingRef.current = true;
      createSilent.mutate(undefined, {
        onSettled: () => { creatingRef.current = false; }
      });
    }

    // If we have a server draft, debounce updates
    if (serverId) {
      if (serverSaveTimeoutRef.current) clearTimeout(serverSaveTimeoutRef.current);
      serverSaveTimeoutRef.current = setTimeout(() => {
        // Only update if not placeholder
        if (!isTipTapEmpty) updateSilent.mutate(serverId);
      }, 800);
      return () => {
        if (serverSaveTimeoutRef.current) clearTimeout(serverSaveTimeoutRef.current);
      };
    }
  }, [title, content, categoryId, serverId, createSilent.isPending]);

  const mCreate = useMutation({
    mutationFn: (isPublished: boolean) => createArticle({ title, content, isPublished, categoryId: categoryId || undefined }),
    onSuccess: async (res) => {
      const id = (res as any)?.data?.id as string | undefined;
      if (id && cover) {
        try {
          await uploadCover(id, cover);
        } catch (e) {
          // Facultatif: notifier l'utilisateur si l'upload échoue
          console.error("Échec de l'upload de la couverture", e);
          alert("La couverture n'a pas pu être téléversée. Vous pourrez la définir dans la page d'édition.");
        }
      }
      try { localStorage.removeItem(draftKey); } catch {}
      if (id) router.replace(`/member/articles/${id}/edit`);
    },
  });

  const canSubmit = title.trim().length >= 5 && content.trim().length > 0;

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      <h1 className="text-2xl font-semibold">Nouvel article</h1>
      <div className="space-y-3">
        <input
          className="w-full px-3 py-2 border rounded"
          placeholder="Titre (min 5 caractères)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="px-3 py-2 border rounded"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Aucune catégorie</option>
          {(cats.data?.data ?? []).map((c: Category) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="border rounded p-3 space-y-2">
          <label className="block text-sm font-medium">Image de couverture (optionnel)</label>
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 rounded border cursor-pointer hover:bg-black/5">
              Choisir une image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCover(e.target.files?.[0] ?? null)}
              />
            </label>
            {cover && <span className="text-sm opacity-80">{cover.name}</span>}
          </div>
          <p className="text-xs opacity-70">La couverture sera téléversée après la création, puis vous serez redirigé vers la page d'édition.</p>
        </div>
        <div>
          <label className="block text-sm mb-1">Contenu</label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            onImageUpload={async (file: File) => {
              const res = await uploadGenericContentImage(file);
              const abs = toAbsoluteImageUrl(res.data.url) ?? res.data.url;
              return { url: abs };
            }}
            onFileUpload={async (file: File) => {
              const form = new FormData();
              form.set("file", file);
              const resp = await fetch("/api/upload-any", { method: "POST", body: form });
              if (!resp.ok) throw new Error("Upload fichier échoué");
              const data = await resp.json();
              // For attachments we can return relative URL; editor will insert a download card
              return { url: data.url as string, name: data.name as string, mime: data.mime as string, size: data.size as number };
            }}
            className="min-h-[60vh] sm:min-h-[400px]"
            showWordCount
          />
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-3">
        <button
          className="px-4 py-2 rounded border hover:bg-black/5 disabled:opacity-50"
          disabled={!canSubmit || mCreate.isPending}
          onClick={() => {
            const isTipTapEmpty = (content || "").trim() === '<p></p>';
            if (serverId) {
              router.replace(`/member/articles/${serverId}/edit`);
            } else {
              if (!isTipTapEmpty) mCreate.mutate(false);
            }
          }}
        >
          Enregistrer comme brouillon
        </button>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white hover:opacity-90 disabled:opacity-50"
          disabled={!canSubmit || mCreate.isPending}
          onClick={() => {
            const isTipTapEmpty = (content || "").trim() === '<p></p>';
            if (serverId) {
              router.replace(`/member/articles/${serverId}/edit`);
            } else {
              if (!isTipTapEmpty) mCreate.mutate(true);
            }
          }}
        >
          Publier
        </button>
      </div>
      {/* Mobile sticky actions */}
      <div className="sm:hidden sticky bottom-0 left-0 right-0 -mx-4 px-4 py-3 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-700 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <button
            className="flex-1 px-4 py-2 rounded border hover:bg-black/5 disabled:opacity-50"
            disabled={!canSubmit || mCreate.isPending}
            onClick={() => {
              const isTipTapEmpty = (content || "").trim() === '<p></p>';
              if (serverId) {
                router.replace(`/member/articles/${serverId}/edit`);
              } else {
                if (!isTipTapEmpty) mCreate.mutate(false);
              }
            }}
          >
            Brouillon
          </button>
          <button
            className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:opacity-90 disabled:opacity-50"
            disabled={!canSubmit || mCreate.isPending}
            onClick={() => {
              const isTipTapEmpty = (content || "").trim() === '<p></p>';
              if (serverId) {
                router.replace(`/member/articles/${serverId}/edit`);
              } else {
                if (!isTipTapEmpty) mCreate.mutate(true);
              }
            }}
          >
            Publier
          </button>
        </div>
      </div>
      {mCreate.isError && (
        <p className="text-red-600">{(mCreate.error as any)?.message || "Erreur lors de la création"}</p>
      )}
    </div>
  );
}
