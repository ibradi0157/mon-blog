"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminGetLegal, adminSetPublished, adminUpdateLegal, LegalPage, LegalSlug } from "@/app/services/legal";
import { RichTextEditor } from "@/app/components/RichTextEditor";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

function defaultTitle(slug: LegalSlug) {
  return slug === "privacy" ? "Politique de confidentialité" : "Conditions d'utilisation";
}

export default function AdminEditLegalPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) as LegalSlug;

  const { data, isLoading, error } = useQuery<LegalPage>({
    queryKey: ["admin-legal", slug],
    queryFn: () => adminGetLegal(slug),
    retry: false,
  });

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [published, setPublished] = useState<boolean>(false);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize local state from server (or defaults if 404)
  useEffect(() => {
    if (initialized) return;
    if (isLoading) return;
    if (data) {
      setTitle(data.title);
      setContent(data.content);
      setPublished(!!data.published);
      setInitialized(true);
      return;
    }
    // If not found, start a new draft
    if (error) {
      setTitle(defaultTitle(slug));
      setContent("<p></p>");
      setPublished(false);
      setInitialized(true);
    }
  }, [initialized, isLoading, data, error, slug]);

  const mutation = useMutation({
    mutationFn: (payload: { title: string; content: string }) => adminUpdateLegal(slug, payload),
    onMutate: () => setSaving(true),
    onSuccess: () => {
      setSaving(false);
      setSavedAt(new Date());
    },
    onError: () => setSaving(false),
  });

  const publishMutation = useMutation({
    mutationFn: (next: boolean) => adminSetPublished(slug, next),
    onMutate: () => setSaving(true),
    onSuccess: (p) => {
      setSaving(false);
      setSavedAt(new Date());
      setPublished(!!p.published);
    },
    onError: () => setSaving(false),
  });

  // Autosave on changes (debounced)
  useEffect(() => {
    if (!initialized) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      mutation.mutate({ title, content });
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, content, initialized]);

  const status = useMemo(() => {
    if (!initialized) return "";
    if (saving) return "Enregistrement…";
    if (savedAt) return `Enregistré à ${savedAt.toLocaleTimeString()}`;
    return "";
  }, [saving, savedAt, initialized]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/legal" className="text-blue-600 hover:underline">← Retour</Link>
          <h2 className="text-xl font-semibold truncate">{defaultTitle(slug)}</h2>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-sm">
          {published ? <Badge variant="success">Publié</Badge> : <Badge variant="muted">Brouillon</Badge>}
          <Button onClick={() => publishMutation.mutate(!published)} disabled={publishMutation.isPending} variant={published ? "warning" : "primary"} size="sm">
            {published ? "Dépublier" : "Publier"}
          </Button>
          {saving ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 animate-pulse">
              Enregistrement…
            </span>
          ) : savedAt ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              Enregistré à {savedAt.toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </div>

      {(!initialized || isLoading) && <p className="text-slate-500">Chargement…</p>}

      {initialized && (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 p-3 sm:p-4 md:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titre</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la page"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contenu</label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Écrivez le contenu légal ici…"
                showWordCount
                className="min-h-[60vh] sm:min-h-[400px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky bottom bar */}
      <div className="sm:hidden sticky bottom-0 left-0 right-0 -mx-4 px-4 py-3 mt-3 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-700 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/legal" className="flex-1 px-3 py-2 rounded border text-center">Retour</Link>
          <Button onClick={() => publishMutation.mutate(!published)} disabled={publishMutation.isPending} className="flex-1">
            {published ? "Dépublier" : "Publier"}
          </Button>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {saving ? "Enregistrement…" : savedAt ? `Enregistré à ${savedAt.toLocaleTimeString()}` : ""}
        </div>
      </div>
    </div>
  );
}
