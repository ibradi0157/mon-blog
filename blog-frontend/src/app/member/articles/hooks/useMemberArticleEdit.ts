"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type Article,
  updateArticle,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  uploadCover,
  removeCover,
  uploadContentImage,
} from "@/app/services/articles";
import { toAbsoluteImageUrl } from "@/app/lib/api";

export type UseMemberArticleEditOptions = {
  id: string;
  article?: Article | null;
};

export function useMemberArticleEdit({ id, article }: UseMemberArticleEditOptions) {
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | "">("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<{ title: string; content: string; categoryId: string | "" } | null>(null);
  const initializedRef = useRef(false);

  // Reset state when switching article id
  useEffect(() => {
    initializedRef.current = false;
    setTitle("");
    setContent("");
    setExcerpt("");
    setCategoryId("");
    setErrorMessage(null);
  }, [id]);

  // Initialize from server article once
  useEffect(() => {
    if (!article || initializedRef.current) return;
    setTitle(article.title || "");
    setContent(article.content || "");
    setExcerpt(article.excerpt || "");
    setCategoryId(article?.category?.id || "");
    lastSavedRef.current = {
      title: article.title || "",
      content: article.content || "",
      categoryId: article?.category?.id || "",
    };
    initializedRef.current = true;
  }, [article]);

  const isPublished = !!(article?.isPublished);

  // Mutations
  const mUpdate = useMutation({
    mutationFn: () => updateArticle(id, { title, content, excerpt: excerpt || null, categoryId: categoryId || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["article", id] });
    },
    onError: (e: any) => setErrorMessage(e?.message || "Échec de l'enregistrement"),
  });

  const mPublish = useMutation({
    mutationFn: async () => {
      try {
        return await publishArticle(id);
      } catch (e) {
        try {
          const res = await updateArticle(id, { isPublished: true });
          return { success: true, data: res.data } as any;
        } catch (_) {
          throw e;
        }
      }
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["article", id] });
      await qc.cancelQueries({ queryKey: ["my-articles"] });
      await qc.cancelQueries({ queryKey: ["admin-articles"] });

      const prevArticle = qc.getQueryData(["article", id]);
      const prevMyLists = qc.getQueriesData({ queryKey: ["my-articles"] });
      const prevAdminLists = qc.getQueriesData({ queryKey: ["admin-articles"] });

      qc.setQueryData(["article", id], (old: any) => {
        if (!old) return old;
        const data = old?.data ?? old;
        const next = { ...data, isPublished: true };
        return old?.data ? { ...old, data: next } : next;
      });
      prevMyLists.forEach(([key]) => {
        qc.setQueryData(key as any, (old: any) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.map((a: any) => (a.id === id ? { ...a, isPublished: true } : a)) };
        });
      });
      prevAdminLists.forEach(([key]) => {
        qc.setQueryData(key as any, (old: any) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.map((a: any) => (a.id === id ? { ...a, isPublished: true } : a)) };
        });
      });

      return { prevArticle, prevMyLists, prevAdminLists } as { prevArticle: any; prevMyLists: [unknown, any][]; prevAdminLists: [unknown, any][] };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevArticle) qc.setQueryData(["article", id], ctx.prevArticle);
      ctx?.prevMyLists?.forEach(([key, data]) => qc.setQueryData(key as any, data));
      ctx?.prevAdminLists?.forEach(([key, data]) => qc.setQueryData(key as any, data));
      setErrorMessage("Échec de la publication");
    },
    onSuccess: () => {
      setErrorMessage(null);
      qc.invalidateQueries({ queryKey: ["article", id] });
      qc.invalidateQueries({ queryKey: ["my-articles"] });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
  });

  const mUnpublish = useMutation({
    mutationFn: async () => {
      try {
        return await unpublishArticle(id);
      } catch (e) {
        try {
          const res = await updateArticle(id, { isPublished: false });
          return { success: true, data: res.data } as any;
        } catch (_) {
          throw e;
        }
      }
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["article", id] });
      await qc.cancelQueries({ queryKey: ["my-articles"] });
      await qc.cancelQueries({ queryKey: ["admin-articles"] });

      const prevArticle = qc.getQueryData(["article", id]);
      const prevMyLists = qc.getQueriesData({ queryKey: ["my-articles"] });
      const prevAdminLists = qc.getQueriesData({ queryKey: ["admin-articles"] });

      qc.setQueryData(["article", id], (old: any) => {
        if (!old) return old;
        const data = old?.data ?? old;
        const next = { ...data, isPublished: false };
        return old?.data ? { ...old, data: next } : next;
      });
      prevMyLists.forEach(([key]) => {
        qc.setQueryData(key as any, (old: any) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.map((a: any) => (a.id === id ? { ...a, isPublished: false } : a)) };
        });
      });
      prevAdminLists.forEach(([key]) => {
        qc.setQueryData(key as any, (old: any) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.map((a: any) => (a.id === id ? { ...a, isPublished: false } : a)) };
        });
      });

      return { prevArticle, prevMyLists, prevAdminLists } as { prevArticle: any; prevMyLists: [unknown, any][]; prevAdminLists: [unknown, any][] };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevArticle) qc.setQueryData(["article", id], ctx.prevArticle);
      ctx?.prevMyLists?.forEach(([key, data]) => qc.setQueryData(key as any, data));
      ctx?.prevAdminLists?.forEach(([key, data]) => qc.setQueryData(key as any, data));
      setErrorMessage("Échec de la dépublication");
    },
    onSuccess: () => {
      setErrorMessage(null);
      qc.invalidateQueries({ queryKey: ["article", id] });
      qc.invalidateQueries({ queryKey: ["my-articles"] });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
  });

  const mDelete = useMutation({
    mutationFn: () => deleteArticle(id),
    onError: (e: any) => setErrorMessage(e?.message || "Échec de la suppression"),
  });

  const mCover = useMutation({
    mutationFn: (file: File) => uploadCover(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["article", id] }),
    onError: (e: any) => setErrorMessage(e?.message || "Échec du téléversement de la couverture"),
  });

  const mRemoveCover = useMutation({
    mutationFn: () => removeCover(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["article", id] }),
    onError: (e: any) => setErrorMessage(e?.message || "Échec de la suppression de la couverture"),
  });

  // Debounced server-side autosave for drafts (not published)
  useEffect(() => {
    if (!article || isPublished) return;

    const minTitleOk = (title || "").trim().length >= 5;
    const isTipTapEmpty = (content || "").trim() === '<p></p>';
    const contentOk = (content || "").trim().length > 0 && !isTipTapEmpty;
    if (!minTitleOk || !contentOk) return;

    // Compare with last saved snapshot to avoid redundant saves
    const last = lastSavedRef.current;
    if (last && last.title === title && last.content === content && last.categoryId === categoryId) return;

    if (mUpdate.isPending) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await mUpdate.mutateAsync();
        lastSavedRef.current = { title, content, categoryId };
      } catch (_) {}
    }, 3000); // Augmenté de 800ms à 3000ms pour éviter ThrottlerException

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, excerpt, categoryId, isPublished, article?.id]);

  const publish = () => mPublish.mutate();
  const unpublish = () => mUnpublish.mutate();
  const updateNow = () => mUpdate.mutate();
  const remove = () => mDelete.mutate();

  const uploadCoverFile = (file: File) => mCover.mutate(file);
  const removeCoverFile = () => mRemoveCover.mutate();

  const onImageUpload = useCallback(async (file: File) => {
    const res = await uploadContentImage(id, file);
    const abs = toAbsoluteImageUrl(res.data.url) ?? res.data.url;
    return { url: abs };
  }, [id]);

  const flags = useMemo(() => ({
    updating: mUpdate.isPending,
    publishing: mPublish.isPending,
    unpublishing: mUnpublish.isPending,
    deleting: mDelete.isPending,
    coverUploading: mCover.isPending,
    removingCover: mRemoveCover.isPending,
  }), [mUpdate.isPending, mPublish.isPending, mUnpublish.isPending, mDelete.isPending, mCover.isPending, mRemoveCover.isPending]);

  return {
    // state
    title, setTitle,
    categoryId, setCategoryId,
    content, setContent,
    excerpt, setExcerpt,
    isPublished,
    errorMessage, setErrorMessage,
    // actions
    publish, unpublish, updateNow, remove,
    uploadCoverFile, removeCoverFile,
    onImageUpload,
    // flags
    ...flags,
  };
}
