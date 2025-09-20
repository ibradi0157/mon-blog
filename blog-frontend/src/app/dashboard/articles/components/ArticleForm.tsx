"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createArticle, updateArticle, uploadCover, publishArticle, type Article, listCategories, uploadContentImage, uploadArticleContentImage, type Category, checkTitleAvailability } from "@/app/services/articles";
import { ModernRichTextEditor } from "@/app/components/ModernRichTextEditor";
import { useRouter } from "next/navigation";
import { toAbsoluteImageUrl } from "@/app/lib/api";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";

export function ArticleForm({ initial, onSuccess }: { initial?: Partial<Article>; onSuccess: (article: Article) => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | "" | null>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [titleValidation, setTitleValidation] = useState<{ checking: boolean; available?: boolean; message?: string }>({ checking: false });

  const TITLE_MIN = 5;

  // Draft autosave
  const draftKey = initial?.id ? `draft:article:${initial.id}` : "draft:article:new";
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Title validation avec debounce
  const validateTitle = useCallback(async (titleToCheck: string) => {
    if (!titleToCheck || titleToCheck.length < TITLE_MIN) {
      setTitleValidation({ checking: false });
      return;
    }

    // Skip validation for existing articles with unchanged title
    if (initial?.title && titleToCheck === initial.title) {
      setTitleValidation({ checking: false, available: true, message: 'Titre actuel' });
      return;
    }

    setTitleValidation({ checking: true });
    try {
      const result = await checkTitleAvailability(titleToCheck);
      setTitleValidation({ checking: false, available: result.available, message: result.message });
    } catch (error) {
      setTitleValidation({ checking: false, available: false, message: 'Erreur lors de la vérification' });
    }
  }, [initial?.title]);

  useEffect(() => {
    setIsMounted(true);
    // Initialiser les valeurs après le montage pour éviter les problèmes d'hydratation
    if (initial) {
      setTitle(initial.title ?? "");
      setContent(initial.content ?? "");
      setIsPublished(initial.isPublished ?? false);
      setCategoryId(initial.category?.id ?? "");
    }
  }, [initial?.id]);

  // Title validation debounce effect
  useEffect(() => {
    if (!isMounted) return;
    
    const timer = setTimeout(() => {
      validateTitle(title);
    }, 500);

    return () => clearTimeout(timer);
  }, [title, validateTitle, isMounted]);

  // Load existing draft if not editing an existing article
  useEffect(() => {
    if (!isMounted) return;
    if (initial?.id) return; // do not override existing article with draft automatically
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        setTitle(d.title ?? "");
        setContent(d.content ?? "");
        setIsPublished(d.isPublished ?? false);
        setCategoryId(d.categoryId ?? "");
        toast("Brouillon restauré");
      }
    } catch (e) {
      // ignore
    }
  }, [isMounted, initial?.id]);

  // Autosave draft (debounced)
  useEffect(() => {
    if (!isMounted) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ title, content, isPublished, categoryId, updatedAt: Date.now() })
        );
      } catch (e) {
        // ignore storage errors
      }
    }, 600);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content, isPublished, categoryId, draftKey, isMounted]);

  const catsQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    select: (res: { success: boolean; data: Category[] } | undefined) => res?.data ?? [],
    placeholderData: (prev) => prev,
  });

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      let res;
      if (initial?.id) {
        res = await uploadContentImage(initial.id, file);
      } else {
        res = await uploadArticleContentImage(file);
      }
      const abs = toAbsoluteImageUrl(res.data.url) ?? res.data.url;
      return { url: abs };
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Erreur lors du téléversement de l'image");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await createArticle({ 
        title, 
        content, 
        categoryId: categoryId || null 
      });
      
      let created = res.data;
      
      if (file) {
        try {
          const coverRes = await uploadCover(created.id, file);
          created = { ...created, coverUrl: coverRes.data.coverUrl };
        } catch (error) {
          console.error("Error uploading cover:", error);
          toast.error("Erreur lors du téléversement de l'image de couverture");
        }
      }
      
      if (isPublished) {
        try {
          const pub = await publishArticle(created.id);
          created = pub.data;
        } catch (error) {
          console.error("Error publishing article:", error);
          toast.error("Erreur lors de la publication de l'article");
        }
      }
      
      return created;
    },
    onSuccess: (a) => {
      setError(null);
      toast.success(isPublished ? "Article publié avec succès" : "Article enregistré comme brouillon");
      try { localStorage.removeItem("draft:article:new"); } catch {}
      onSuccess(a);
      router.push(`/dashboard/articles/${a.id}/edit`);
    },
    onError: (e: any) => {
      const status = e?.response?.status ? ` (${e.response.status})` : "";
      const message = e?.response?.data?.message || e?.message || "Une erreur inconnue est survenue";
      console.error("Failed to create article:", e);
      setError(message + status);
      toast.error(`Erreur: ${message}`);
    },
  });

  const updateMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await updateArticle(id, { 
        title, 
        content, 
        isPublished, 
        categoryId: categoryId ?? null 
      });
      
      let updated = res.data;
      
      if (file) {
        try {
          const coverRes = await uploadCover(updated.id, file);
          updated = { ...updated, coverUrl: coverRes.data.coverUrl };
        } catch (error) {
          console.error("Error updating cover:", error);
          toast.error("Erreur lors de la mise à jour de l'image de couverture");
        }
      }
      
      return updated;
    },
    onSuccess: (a) => {
      setError(null);
      toast.success("Article mis à jour avec succès");
      try { localStorage.removeItem(draftKey); } catch {}
      onSuccess(a);
    },
    onError: (e: any) => {
      const message = e?.response?.data?.message || e?.message || "Une erreur est survenue lors de la mise à jour";
      console.error("Failed to update article:", e);
      setError(message);
      toast.error(`Erreur: ${message}`);
    },
  });

  const isEdit = !!initial?.id;
  const loading = createMut.isPending || updateMut.isPending || isUploading;
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;

  function isContentEmpty(html: string) {
    if (!html) return true;
    // Remove HTML tags and trim
    const text = html.replace(/<[^>]*>?/gm, '').replace(/&[a-z]+;/g, ' ').trim();
    // Remove zero-width spaces and other invisible characters
    return !text.replace(/[\u200B\u200C\u200D\uFEFF\u00A0\s]/g, '').length;
  }

  const titleTooShort = title.trim().length < TITLE_MIN;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (!title.trim()) {
          setError("Le titre est requis.");
          return;
        }
        if (titleTooShort) {
          setError(`Le titre doit contenir au moins ${TITLE_MIN} caractères.`);
          return;
        }
        if (titleValidation.available === false) {
          setError("Ce titre n'est pas disponible");
          return;
        }
        if (isContentEmpty(content)) {
          setError("Le contenu est requis.");
          return;
        }
        if (isEdit && initial?.id) updateMut.mutate(initial.id);
        else createMut.mutate();
      }}
      className="space-y-4"
    >
      {error && (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm mb-1">Titre</label>
        <div className="relative">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={TITLE_MIN}
            aria-invalid={titleTooShort || titleValidation.available === false}
            aria-describedby="title-help"
            className={
              titleValidation.available === false 
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                : titleValidation.available === true
                  ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                  : ''
            }
          />
          {titleValidation.checking && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div className="mt-1 space-y-1">
          <p id="title-help" className={`text-xs ${titleTooShort ? "text-red-600" : "opacity-70"}`}>
            Minimum {TITLE_MIN} caractères
          </p>
          {titleValidation.message && !titleValidation.checking && (
            <p className={`text-xs ${
              titleValidation.available ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
            }`}>
              {titleValidation.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Contenu</label>
        <div className="border rounded-lg overflow-hidden">
          {isMounted && (
            <ModernRichTextEditor
              value={content}
              onChange={setContent}
              onImageUpload={handleImageUpload}
              onFileUpload={async (file: File) => {
                const form = new FormData();
                form.set("file", file);
                const resp = await fetch("/api/upload-any", { method: "POST", body: form });
                if (!resp.ok) throw new Error("Upload fichier échoué");
                const data = await resp.json();
                return { url: data.url as string, name: data.name as string, mime: data.mime as string, size: data.size as number };
              }}
              placeholder="Écrivez votre article ici..."
              className="min-h-[60vh] sm:min-h-[400px]"
              showWordCount={true}
            />
          )}
          {isUploading && (
            <div className="p-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 border-t">
              Téléversement de l'image en cours...
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Catégorie</label>
        <div className="flex items-center gap-2">
          <Select value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value)} disabled={catsQuery.isLoading}>
            <option value="">— Aucune —</option>
            {(catsQuery.data ?? []).map((c: Category) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          {catsQuery.isLoading && <span className="text-xs opacity-70">Chargement…</span>}
          {catsQuery.isError && <span className="text-xs text-rose-600">Erreur de chargement des catégories</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="published" type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        <label htmlFor="published">Publier immédiatement</label>
      </div>
      <div>
        <label className="block text-sm mb-1">Image de couverture</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {initial?.coverUrl && <p className="text-xs opacity-70 mt-1">Actuelle: {initial.coverUrl}</p>}
      </div>
      {/* Desktop actions */}
      <div className="hidden sm:flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading || isUploading}>
          {loading ? (isEdit ? "Mise à jour..." : "Création...") : (isEdit ? "Mettre à jour" : "Publier l'article")}
        </Button>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="sm:hidden sticky bottom-0 left-0 right-0 -mx-4 px-4 py-3 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-700 backdrop-blur z-10">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="flex-1">Annuler</Button>
          <Button type="submit" disabled={loading || isUploading} className="flex-1">
            {loading ? (isEdit ? "Mise à jour..." : "Création...") : (isEdit ? "Mettre à jour" : "Publier")}
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
        {wordCount} mots • {content.length} caractères
      </div>
    </form>
  );
}
