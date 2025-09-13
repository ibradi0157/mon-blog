"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "../services/comments";
import { useAuth } from "../providers/AuthProvider";

export function CommentForm({ articleId }: { articleId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_LEN = 1000;
  const MIN_LEN = 2;
  const { mutate, isPending } = useMutation({
    mutationFn: () => createComment(articleId, content.trim()),
    onMutate: () => setError(null),
    onSuccess: () => {
      setContent("");
      try {
        localStorage.removeItem(`comment:draft:${articleId}`);
      } catch {}
      qc.invalidateQueries({ queryKey: ["comments", articleId] });
      qc.invalidateQueries({ queryKey: ["article-stats", articleId] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Une erreur est survenue.";
      setError(Array.isArray(msg) ? msg.join(" ") : String(msg));
    },
  });

  // Charger le brouillon s'il existe
  useEffect(() => {
    try {
      const draft = localStorage.getItem(`comment:draft:${articleId}`);
      if (draft) setContent(draft);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarder le brouillon à chaque modification
  useEffect(() => {
    try {
      if (content.trim()) localStorage.setItem(`comment:draft:${articleId}`, content);
      else localStorage.removeItem(`comment:draft:${articleId}`);
    } catch {}
  }, [articleId, content]);

  // Auto-redimensionnement de la zone de texte
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 280) + "px"; // limite la hauteur
  }, [content]);

  if (!user) return <p className="opacity-80 text-sm text-slate-700 dark:text-slate-300">Connectez-vous pour laisser un commentaire.</p>;
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (content.trim().length < MIN_LEN) return;
        mutate();
      }}
    >
      <label htmlFor="comment-content" className="sr-only">Votre commentaire</label>
      <textarea
        id="comment-content"
        ref={textareaRef}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 p-3 min-h-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Votre commentaire... (Ctrl/⌘+Entrée pour publier)"
        value={content}
        maxLength={MAX_LEN}
        aria-invalid={!!error}
        aria-describedby="comment-help comment-count"
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            if (content.trim().length >= MIN_LEN && !isPending) mutate();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setContent("");
          }
        }}
      />
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span id="comment-help">Astuce: Ctrl/⌘+Entrée pour publier</span>
        <span id="comment-count">{content.length}/{MAX_LEN}</span>
      </div>
      {error && (
        <div className="text-[12px] text-rose-600 dark:text-rose-400">{error}</div>
      )}
      <button
        disabled={isPending || content.trim().length < MIN_LEN}
        className="self-end px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
        title={content.trim().length < MIN_LEN ? `Minimum ${MIN_LEN} caractères` : undefined}
      >
        {isPending ? "Publication…" : "Publier"}
      </button>
    </form>
  );
}
