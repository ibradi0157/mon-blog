"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listComments,
  updateComment,
  deleteComment,
  likeComment,
  createComment,
  listReplies,
  reportComment,
  type Comment,
} from "../services/comments";
import { useAuth } from "../providers/AuthProvider";
import { Heart, ThumbsDown } from "lucide-react";

export function CommentList({ articleId, articleAuthorId }: { articleId: string; articleAuthorId?: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ success: boolean; data: Comment[] }>({
    queryKey: ["comments", articleId],
    queryFn: () => listComments(articleId),
  });
  const comments = data?.data ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const MAX_REPLY = 1000;
  const MIN_REPLY = 2;
  const [replyError, setReplyError] = useState<string | null>(null);

  // Utils
  const getInitials = (nameOrEmail?: string | null) => {
    if (!nameOrEmail) return "U";
    const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
    const tokens = base.trim().split(/\s+/).filter(Boolean);
    const chars = (tokens[0]?.[0] || "") + (tokens[1]?.[0] || "");
    return (chars || base[0] || "U").toUpperCase();
  };

  const roleBadge = (tag?: string, ownsArticle?: boolean) => {
    const t = (tag || "").toUpperCase();
    if (ownsArticle) return { label: "Auteur", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" };
    if (t === "PRIMARY_ADMIN" || t === "SECONDARY_ADMIN") return { label: "Admin", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
    if (t === "MEMBER") return { label: "Membre", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" };
    return null;
  };

  // Format de date déterministe (UTC) pour éviter les mismatches SSR/CSR
  const formatDateUTC = (iso?: string | Date) => {
    if (!iso) return "";
    const d = new Date(iso);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi} UTC`;
  };

  // Auto-focus the reply textarea when a thread is selected
  useEffect(() => {
    if (replyingTo) {
      const el = document.getElementById(`reply-textarea-${replyingTo}`) as HTMLTextAreaElement | null;
      el?.focus();
    }
  }, [replyingTo]);

  const updateMut = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => updateComment(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", articleId] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", articleId] });
      qc.invalidateQueries({ queryKey: ["article-stats", articleId] });
    },
  });

  const reactMut = useMutation({
    mutationFn: ({ commentId, isLike }: { commentId: string; isLike: boolean }) => likeComment(articleId, commentId, isLike),
    onSuccess: (_res, vars) => {
      // Toggle local reaction state like on the article page
      setReactions((prev) => {
        const prevVal = prev[vars.commentId] ?? null;
        const nextVal = vars.isLike ? (prevVal === "like" ? null : "like") : prevVal === "dislike" ? null : "dislike";
        try {
          const key = `comment:reaction:${vars.commentId}`;
          if (nextVal) localStorage.setItem(key, nextVal);
          else localStorage.removeItem(key);
        } catch {}
        return { ...prev, [vars.commentId]: nextVal };
      });
      qc.invalidateQueries({ queryKey: ["comments", articleId] });
    },
  });

  const replyMut = useMutation({
    mutationFn: ({ parentId, content }: { parentId: string; content: string }) => createComment(articleId, content, parentId),
    onMutate: async ({ parentId }) => {
      setReplyError(null);
      setOpenReplies((m) => ({ ...m, [parentId]: true }));
      setReplyCounts((m) => ({ ...m, [parentId]: (m[parentId] ?? 0) + 1 }));
      return { parentId } as { parentId: string };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.parentId) {
        setReplyCounts((m) => ({ ...m, [ctx.parentId]: Math.max(0, (m[ctx.parentId] ?? 1) - 1) }));
      }
    },
    onSuccess: (_res, vars) => {
      setReplyingTo(null);
      setReplyText("");
      setReplyError(null);
      setOpenReplies((m) => ({ ...m, [vars.parentId]: true }));
      // Smooth scroll to the replies list
      setTimeout(() => {
        const el = document.getElementById(`replies-${vars.parentId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
      qc.invalidateQueries({ queryKey: ["comments", articleId] });
      qc.invalidateQueries({ queryKey: ["article-stats", articleId] });
      if (vars.parentId) qc.invalidateQueries({ queryKey: ["replies", vars.parentId] });
    },
  });

  const reportMut = useMutation({
    mutationFn: ({ commentId, reason }: { commentId: string; reason: string }) => reportComment(commentId, reason),
  });

  const startEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditText(c.content);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };
  const submitEdit = (id: string) => {
    if (!editText.trim()) return;
    updateMut.mutate({ id, content: editText.trim() }, { onSuccess: cancelEdit });
  };
  const submitReply = (parentId: string) => {
    if (!replyText.trim()) return;
    replyMut.mutate({ parentId, content: replyText.trim() });
  };

  const canInteract = !!user;
  const isBusy = updateMut.isPending || deleteMut.isPending || reactMut.isPending || replyMut.isPending || reportMut.isPending;

  // Local reaction state per comment to render active styles like article actions
  const [reactions, setReactions] = useState<Record<string, "like" | "dislike" | null>>({});
  useEffect(() => {
    const map: Record<string, "like" | "dislike" | null> = {};
    comments.forEach((c) => {
      try {
        const r = localStorage.getItem(`comment:reaction:${c.id}`);
        map[c.id] = r === "like" || r === "dislike" ? (r as any) : null;
      } catch {}
    });
    setReactions(map);
  }, [comments]);

  const showNumber = (n?: number) => (typeof n === "number" ? n : 0);

  if (isLoading) return <p className="opacity-70">Chargement des commentaires…</p>;

  function RepliesList({ parentId, open, onCountChange, onReplyTo }: { parentId: string; open: boolean; onCountChange?: (n: number) => void; onReplyTo?: (parentId: string, mention?: string) => void }) {
    const repliesQ = useQuery<{ success: boolean; data: Comment[] }>({
      queryKey: ["replies", parentId],
      queryFn: () => listReplies(parentId),
      enabled: open,
      placeholderData: (prev) => prev,
      staleTime: 10_000,
      refetchOnWindowFocus: false,
      retry: 1,
    });
    const replies = repliesQ.data?.data ?? [];
    useEffect(() => {
      if (!open) return;
      // Intentionally omit onCountChange from deps to avoid identity-change loops
      onCountChange?.(replies.length);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, replies.length]);
    return (
      <ul id={`replies-${parentId}`} className="mt-2 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-2">
        {open && repliesQ.isLoading && (
          <>
            {[...Array(2)].map((_, i) => (
              <li key={i} className="animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              </li>
            ))}
          </>
        )}
        {open && replies.map((r) => {
          const tag = (r.authorTag || "").toUpperCase();
          const isStaffOrMember = tag === "PRIMARY_ADMIN" || tag === "SECONDARY_ADMIN" || tag === "MEMBER";
          const ownsArticle = !!articleAuthorId && r.author?.id === articleAuthorId;
          const nameClass = isStaffOrMember ? (ownsArticle ? "text-blue-600" : "text-green-600") : "";
          const badge = roleBadge(tag, ownsArticle);
          return (
            <li key={r.id} className="text-sm">
              <div className="flex items-center justify-between text-xs opacity-80 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-semibold text-slate-700 dark:text-slate-200">
                    {getInitials(r.author?.displayName || r.author?.email)}
                  </div>
                  <span className={`font-medium ${nameClass}`}>{r.author?.displayName || r.author?.email || "Utilisateur"}</span>
                  {badge && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>}
                </div>
                {r.createdAt && <span>{formatDateUTC(r.createdAt)}</span>}
              </div>
              <p className="text-sm whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">{r.content}</p>
              <div className="mt-1">
                <button
                  className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={() => onReplyTo?.(parentId, `@${r.author?.displayName || r.author?.email || "Utilisateur"}`)}
                >
                  Répondre
                </button>
              </div>
            </li>
          );
        })}
        {open && replies.length === 0 && !repliesQ.isLoading && (
          <li className="text-xs opacity-70">Aucune réponse</li>
        )}
      </ul>
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((c: Comment) => {
        const isOwner = user?.id && c.author?.id && user.id === c.author.id;
        const tag = (c.authorTag || "").toUpperCase();
        const isStaffOrMember = tag === "PRIMARY_ADMIN" || tag === "SECONDARY_ADMIN" || tag === "MEMBER";
        const ownsArticle = !!articleAuthorId && c.author?.id === articleAuthorId;
        const nameClass = isStaffOrMember ? (ownsArticle ? "text-blue-600" : "text-green-600") : "";
        const badge = roleBadge(tag, ownsArticle);
        return (
          <li key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs opacity-80 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                  {getInitials(c.author?.displayName || c.author?.email)}
                </div>
                <span className={`font-medium ${nameClass}`}>{c.author?.displayName || c.author?.email || "Utilisateur"}</span>
                {badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              {c.createdAt && <span>{formatDateUTC(c.createdAt)}</span>}
            </div>

            {editingId === c.id ? (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 min-h-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    disabled={isBusy}
                    onClick={() => submitEdit(c.id)}
                    className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-60"
                  >
                    Enregistrer
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={cancelEdit}
                    className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">{c.content}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                disabled={!canInteract || isBusy}
                title={!canInteract ? "Connectez-vous pour liker" : undefined}
                onClick={() => reactMut.mutate({ commentId: c.id, isLike: true })}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-60 ${
                  reactions[c.id] === "like"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                }`}
              >
                <Heart className={`w-4 h-4 ${reactions[c.id] === "like" ? "fill-current" : ""}`} />
                <span>{showNumber(c.likes)}</span>
              </button>
              <button
                disabled={!canInteract || isBusy}
                title={!canInteract ? "Connectez-vous pour disliker" : undefined}
                onClick={() => reactMut.mutate({ commentId: c.id, isLike: false })}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-60 ${
                  reactions[c.id] === "dislike"
                    ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <ThumbsDown className={`w-4 h-4 ${reactions[c.id] === "dislike" ? "fill-current" : ""}`} />
                <span>{showNumber(c.dislikes)}</span>
              </button>

              <button
                disabled={!canInteract || isBusy}
                onClick={() => {
                  const next = replyingTo === c.id ? null : c.id;
                  setReplyingTo(next);
                  setReplyText(next ? `@${c.author?.displayName || c.author?.email || "Utilisateur"} ` : "");
                  setOpenReplies((m) => ({ ...m, [c.id]: true }));
                  if (next) setTimeout(() => {
                    const el = document.getElementById(`reply-textarea-${c.id}`) as HTMLTextAreaElement | null;
                    el?.focus();
                  }, 0);
                }}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Répondre
              </button>

              <button
                disabled={isBusy}
                onClick={() => {
                  const reason = window.prompt("Raison du signalement ? (ex: propos offensants)");
                  if (reason && reason.trim()) reportMut.mutate({ commentId: c.id, reason: reason.trim() });
                }}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
              >
                Signaler
              </button>

              {isOwner && editingId !== c.id && (
                <>
                  <button
                    disabled={isBusy}
                    onClick={() => startEdit(c)}
                    className="ml-2 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
                  >
                    Éditer
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={() => {
                      if (window.confirm("Supprimer ce commentaire ?")) deleteMut.mutate(c.id);
                    }}
                    className="px-2 py-1 rounded bg-rose-600 text-white disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                </>
              )}

              <button
                onClick={() => setOpenReplies((m) => ({ ...m, [c.id]: !m[c.id] }))}
                className="ml-auto px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {openReplies[c.id]
                  ? `Masquer les réponses${replyCounts[c.id] != null ? ` (${replyCounts[c.id]})` : ""}`
                  : `Afficher les réponses${replyCounts[c.id] != null ? ` (${replyCounts[c.id]})` : ""}`}
              </button>
            </div>

            {replyingTo === c.id && (
              <div className="mt-2 space-y-2">
                <textarea
                  id={`reply-textarea-${c.id}`}
                  className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 min-h-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre réponse... (Ctrl/⌘+Entrée pour envoyer, Échap pour annuler)"
                  value={replyText}
                  maxLength={MAX_REPLY}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      submitReply(c.id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setReplyingTo(null);
                    }
                  }}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Astuce: Ctrl/⌘+Entrée pour envoyer • Échap pour annuler</span>
                  <span>{replyText.length}/{MAX_REPLY}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    disabled={!canInteract || isBusy || replyText.trim().length < MIN_REPLY}
                    onClick={() => submitReply(c.id)}
                    className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-60"
                  >
                    {replyMut.isPending ? "Envoi…" : "Envoyer la réponse"}
                  </button>
                  <button disabled={isBusy} onClick={() => setReplyingTo(null)} className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-60">
                    Annuler
                  </button>
                </div>
              </div>
            )}

            <RepliesList
              parentId={c.id}
              open={!!openReplies[c.id]}
              onCountChange={(n) =>
                setReplyCounts((m) => (m[c.id] === n ? m : { ...m, [c.id]: n }))
              }
              onReplyTo={(parentId, mention) => {
                setReplyingTo(parentId);
                setReplyText(mention ? `${mention} ` : "");
                setOpenReplies((m) => ({ ...m, [parentId]: true }));
                setTimeout(() => {
                  const el = document.getElementById(`reply-textarea-${parentId}`) as HTMLTextAreaElement | null;
                  el?.focus();
                }, 0);
              }}
            />
          </li>
        );
      })}
      {comments.length === 0 && <li className="opacity-70">Aucun commentaire</li>}
    </ul>
  );
}
