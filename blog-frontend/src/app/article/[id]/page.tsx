"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useParams } from "next/navigation";
import createDOMPurify from "dompurify";
import {
  List,
  Share2,
  ArrowUp,
  X,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  User,
  Calendar,
  Clock,
  Heart,
  ThumbsDown,
  Eye,
  MessageCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPublicArticle, type Article } from "../../services/articles";
import { toAbsoluteImageUrl, buildSrcSet } from "../../lib/api";
import {
  getArticleStats,
  viewArticle,
  likeArticle as likeArticleStats,
  dislikeArticle as dislikeArticleStats,
} from "../../services/stats";
const LazyCommentForm = lazy(() => import("../../components/CommentForm").then(m => ({ default: m.CommentForm })));
const LazyCommentList = lazy(() => import("../../components/CommentList").then(m => ({ default: m.CommentList })));
import { useAuth } from "../../providers/AuthProvider";
import { generateSlug } from "../../lib/seo";
import { ArticleSubscriptionWidget } from '@/app/components/ArticleSubscriptionWidget';


// Utils
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// use generateSlug from seo utils for robust accent handling

function estimateReadingTime(html: string) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  const wpm = 200;
  return Math.max(1, Math.round(words / wpm));
}

type Heading = { id: string; text: string; level: 1 | 2 | 3 | 4 | 5 | 6 };

export default function ArticlePage() {
  const params = useParams();
  const id = useMemo(() => {
    const value = (params as any)?.id;
    return Array.isArray(value) ? (value[0] as string) : (value as string);
  }, [params]);

  const { token } = useAuth();
  const qc = useQueryClient();

  // Data fetching
  const articleQ = useQuery<{ success: boolean; data: Article }>({
    queryKey: ["public-article", id],
    queryFn: () => getPublicArticle(id),
    enabled: !!id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const article = articleQ.data?.data;

  const statsQ = useQuery<{ success: boolean; data: { views: number; likes: number; dislikes: number; commentsCount: number } }>({
    queryKey: ["article-stats", id],
    queryFn: () => getArticleStats(id),
    enabled: !!id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const s = statsQ.data?.data;

  // Register a view (server-side dedup + client TTL dedup)
  const viewedRef = useRef(false);
  const VIEW_TTL_MS_CLIENT = 3 * 60 * 60 * 1000; // 3h: aligned with backend dedup to prevent double counting
  const VIEW_PENDING_MS = 10_000; // guard duplicates within 10s (StrictMode remounts)
  useEffect(() => {
    if (!id) return;
    if (viewedRef.current) return;

    // Client-side TTL to reduce network calls on quick revisits
    let shouldView = true;
    const pendingKey = `article:viewed:pending:${id}`;
    try {
      const key = `article:viewed:${id}`;
      const raw = localStorage.getItem(key);
      const last = raw ? parseInt(raw, 10) : 0;
      if (last && Date.now() - last < VIEW_TTL_MS_CLIENT) {
        shouldView = false;
      }
      // Also guard if a recent in-flight mark exists (handles StrictMode double-mount)
      const p = sessionStorage.getItem(pendingKey);
      const plast = p ? parseInt(p, 10) : 0;
      if (plast && Date.now() - plast < VIEW_PENDING_MS) {
        shouldView = false;
      }
    } catch {}

    viewedRef.current = true;
    if (!shouldView) return;

    try { sessionStorage.setItem(pendingKey, String(Date.now())); } catch {}

    // Optimistic update BEFORE network, with rollback on error
    const prevStats = qc.getQueryData<{ success: boolean; data: { views: number; likes: number; dislikes: number; commentsCount: number } }>(["article-stats", id]);
    try {
      qc.setQueryData<{ success: boolean; data: { views: number; likes: number; dislikes: number; commentsCount: number } }>(
        ["article-stats", id],
        (prev) => (
          prev
            ? { success: true, data: { ...prev.data, views: (prev.data.views ?? 0) + 1 } }
            : { success: true, data: { views: 1, likes: 0, dislikes: 0, commentsCount: 0 } }
        )
      );
      setViewsOverride((prev) => (typeof prev === 'number' ? prev + 1 : (typeof s?.views === 'number' ? s.views + 1 : 1)));
    } catch {}

    viewArticle(id)
      .then(() => {
        try { localStorage.setItem(`article:viewed:${id}`, String(Date.now())); } catch {}
        qc.invalidateQueries({ queryKey: ["article-stats", id] });
      })
      .catch(() => {
        // rollback if request failed
        if (prevStats) qc.setQueryData(["article-stats", id], prevStats);
      })
      .finally(() => { try { sessionStorage.removeItem(pendingKey); } catch {} });
  }, [id, qc]);

  // Reaction state persisted locally for quick UI feedback
  const REACTION_KEY = useMemo(() => (id ? `article:reaction:${id}` : ""), [id]);
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);
  useEffect(() => {
    if (!REACTION_KEY) return;
    try {
      const r = localStorage.getItem(REACTION_KEY) as "like" | "dislike" | null;
      if (r === "like" || r === "dislike") setReaction(r);
      else setReaction(null);
    } catch {}
  }, [REACTION_KEY]);
  useEffect(() => {
    if (!REACTION_KEY) return;
    try {
      if (!reaction) localStorage.removeItem(REACTION_KEY);
      else localStorage.setItem(REACTION_KEY, reaction);
    } catch {}
  }, [REACTION_KEY, reaction]);

  const likeMut = useMutation({
    mutationFn: () => likeArticleStats(id),
    onSuccess: () => {
      setReaction((prev) => (prev === "like" ? null : "like"));
      qc.invalidateQueries({ queryKey: ["article-stats", id] });
    },
  });
  const dislikeMut = useMutation({
    mutationFn: () => dislikeArticleStats(id),
    onSuccess: () => {
      setReaction((prev) => (prev === "dislike" ? null : "dislike"));
      qc.invalidateQueries({ queryKey: ["article-stats", id] });
    },
  });

  // Reading progress
  const articleRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const metricsRef = useRef<{ top: number; total: number }>({ top: 0, total: 0 });

  const computeMetrics = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;
    const rectTop = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    metricsRef.current = { top: rectTop, total: total > 0 ? total : 0 };
  }, []);

  useEffect(() => {
    let ticking = false;
    const recalc = () => {
      const el = articleRef.current;
      if (!el) {
        ticking = false;
        return;
      }
      const { top, total } = metricsRef.current;
      const scrolled = window.scrollY - top;
      const ratio = clamp(total > 0 ? scrolled / total : 0, 0, 1);
      setReadingProgress(Math.round(ratio * 100));
      setShowScrollTop(window.scrollY > 300);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(recalc);
        ticking = true;
      }
    };
    computeMetrics();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => { computeMetrics(); onScroll(); };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [computeMetrics]);

  // TOC and heading anchors
  const [headings, setHeadings] = useState<Heading[]>([]);
  const isRefreshingHeadings = useRef(false);
  const [showToc, setShowToc] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const scrollOffset = 80; // account for fixed progress bar / headers
  const headingsInitialized = useRef(false);

  // requestIdleCallback polyfill
  const requestIdle = useCallback((cb: () => void) => {
    try {
      const anyWin = window as any;
      if (typeof anyWin.requestIdleCallback === 'function') return anyWin.requestIdleCallback(cb, { timeout: 600 });
    } catch {}
    return window.setTimeout(cb, 200);
  }, []);
  const cancelIdle = useCallback((id: number) => {
    try {
      const anyWin = window as any;
      if (typeof anyWin.cancelIdleCallback === 'function') return anyWin.cancelIdleCallback(id);
    } catch {}
    clearTimeout(id);
  }, []);

  const sanitizedContent = useMemo(() => {
    if (typeof window === "undefined") return "";
    const DOMPurify = createDOMPurify(window);
    return DOMPurify.sanitize(article?.content || "");
  }, [article?.content]);

  // Robust scroll helper for anchors (defined early to avoid lint about use-before-declare)
  const scrollToAnchor = useCallback((id: string) => {
    setActiveHeading(id);
    const el = document.getElementById(id);
    if (!el) return;
    
    // Calculate the precise scroll position accounting for fixed header
    const elementTop = el.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementTop - scrollOffset;
    
    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: "smooth"
    });
    
    // Focus after a brief delay to ensure scroll is complete
    setTimeout(() => {
      (el as HTMLElement).focus({ preventScroll: true });
    }, 100);
  }, [scrollOffset]);

  const refreshHeadings = useCallback(() => {
    const root = contentRef.current;
    if (!root) return;

    // Use a broad selector and filter in JS to avoid expensive :has()
    const elements = Array.from(
      root.querySelectorAll("h1, h2, h3, h4, h5, h6, p")
    ) as HTMLElement[];

    const seen = new Map<string, number>();
    const hs: Heading[] = [];

    // Avoid heavy work on extremely large contents
    if (elements.length > 400) {
      setHeadings((prev) => (prev.length ? [] : prev));
      isRefreshingHeadings.current = false;
      return;
    }

    isRefreshingHeadings.current = true;
    for (const el of elements) {
      let text = "";
      let level: Heading['level'] = 2;

      if (el.tagName.toLowerCase().startsWith('h')) {
        text = (el.textContent || "").trim();
        level = parseInt(el.tagName.substring(1), 10) as Heading['level'];
      } else if (el.tagName.toLowerCase() === 'p') {
        const first = el.firstElementChild as HTMLElement | null;
        if (first && first.tagName.toLowerCase() === 'strong') {
          text = (first.textContent || el.textContent || "").trim();
          level = 2;
        } else {
          continue; // skip normal paragraphs
        }
      }

      if (!text) continue;

      let base = generateSlug(text) || "section";
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      const idVal = n ? `${base}-${n}` : base;
      
      if (el.id !== idVal) el.id = idVal;
      if (el.getAttribute('tabindex') !== '-1') el.setAttribute('tabindex', '-1');
      const desiredScrollMargin = `${scrollOffset + 12}px`;
      if (el.style.scrollMarginTop !== desiredScrollMargin) {
        el.style.scrollMarginTop = desiredScrollMargin;
      }

      hs.push({ id: idVal, text, level });
    }

    setHeadings((prev) => {
      if (prev.length === hs.length && prev.every((p, i) => p.id === hs[i].id && p.text === hs[i].text && p.level === hs[i].level)) {
        return prev;
      }
      return hs;
    });
    isRefreshingHeadings.current = false;
  }, [scrollOffset]);

  useEffect(() => {
    // Compute headings lazily: only when TOC opened, or during idle if small document
    let rafId = 0 as number | 0;
    let idleId = 0 as unknown as number;
    const maybeInit = () => {
      if (headingsInitialized.current) return;
      rafId = requestAnimationFrame(() => {
        const root = contentRef.current;
        const count = root ? root.querySelectorAll('h1, h2, h3, h4, h5, h6, p').length : 0;
        if (count && count <= 200) {
          refreshHeadings();
          headingsInitialized.current = true;
          const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
          if (hash) setTimeout(() => scrollToAnchor(hash), 0);
        } else {
          // Defer to idle for large docs
          idleId = requestIdle(() => {
            if (!headingsInitialized.current) {
              refreshHeadings();
              headingsInitialized.current = true;
            }
          }) as unknown as number;
        }
      });
    };
    maybeInit();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (idleId) cancelIdle(idleId);
    };
  }, [sanitizedContent, refreshHeadings, scrollToAnchor, requestIdle, cancelIdle]);

  useEffect(() => {
    // Attach observer only when TOC is visible (user intent)
    if (!showToc) return;
    const root = contentRef.current || articleRef.current;
    if (!root) return;
    let rafId = 0 as number | 0;
    const lastRef = { t: 0 };
    const obs = new MutationObserver(() => {
      if (isRefreshingHeadings.current) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const now = Date.now();
        if (now - lastRef.t < 200) return; // throttle to every 200ms max
        lastRef.t = now;
        refreshHeadings();
        computeMetrics();
      });
    });
    obs.observe(root, { subtree: true, childList: true });
    return () => {
      obs.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [showToc, refreshHeadings, computeMetrics]);

  // Highlight effect for TOC clicks
  useEffect(() => {
    if (!activeHeading) return;

    const el = document.getElementById(activeHeading);
    if (!el) return;

    // Add a class to trigger the highlight
    el.classList.add("highlight-heading");

    // Remove the class after a delay
    const timer = setTimeout(() => {
      el.classList.remove("highlight-heading");
      setActiveHeading(null);
    }, 2000); // Highlight for 2 seconds

    return () => clearTimeout(timer);
  }, [activeHeading]);


  // Share helpers
  const [showShareMenu, setShowShareMenu] = useState(false);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareOnFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, "_blank");
  const shareOnTwitter = () =>
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(article?.title || "")}`,
      "_blank"
    );
  const shareOnLinkedIn = () =>
    window.open(
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(article?.title || "")}`,
      "_blank"
    );
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setShowShareMenu(false);
    } catch {}
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Cover absolute URL
  const cover = toAbsoluteImageUrl(article?.coverUrl);
  const coverSrcSet = buildSrcSet(article?.thumbnails);

  const canReact = !!token;
  const reacting = likeMut.isPending || dislikeMut.isPending;
  const showNumber = (n?: number) => (typeof n === "number" ? n : "-");
  const readingTime = estimateReadingTime(article?.content || "");

  const [showComments, setShowComments] = useState(false);
  const [viewsOverride, setViewsOverride] = useState<number | undefined>(undefined);

  // Sync local override with server value when it increases
  useEffect(() => {
    const v = s?.views;
    if (typeof v === 'number') {
      setViewsOverride((prev) => (typeof prev === 'number' ? Math.max(prev, v) : v));
    }
  }, [s?.views]);

  

  if (articleQ.isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-2 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
        <div className="space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }
  if (articleQ.isError || !article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-700 dark:text-slate-300">
        <p>Impossible de charger l'article.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed right-6 bottom-6 flex flex-col space-y-3 z-40">
        {/* Table of Contents */}
        {headings.length > 0 && (
          <button
            onClick={() => setShowToc(!showToc)}
            className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <List className="w-5 h-5" />
          </button>
        )}

        {/* Share Button */}
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Scroll to Top */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-white"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Share Menu */}
      {showShareMenu && (
        <div className="fixed right-20 bottom-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-900 dark:text-white">Partager</h3>
            <button onClick={() => setShowShareMenu(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex space-x-2">
            <button onClick={shareOnFacebook} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Facebook className="w-4 h-4" />
            </button>
            <button onClick={shareOnTwitter} className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors">
              <Twitter className="w-4 h-4" />
            </button>
            <button onClick={shareOnLinkedIn} className="p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors">
              <Linkedin className="w-4 h-4" />
            </button>
            <button onClick={copyToClipboard} className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
              <Link2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table of Contents */}
      {showToc && headings.length > 0 && (
        <div className="fixed right-4 md:right-20 bottom-28 md:bottom-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-4 z-50 max-w-xs max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-900 dark:text-white">Table des matières</h3>
            <button onClick={() => setShowToc(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav className="space-y-1">
            {headings.map((h, idx) => (
              <a
                key={idx}
                href={`#${h.id}`}
                className={`block text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                  h.level === 1
                    ? "font-medium text-slate-900 dark:text-white"
                    : h.level === 2
                    ? "pl-3 text-slate-700 dark:text-slate-300"
                    : "pl-6 text-slate-600 dark:text-slate-400"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToAnchor(h.id);
                  setShowToc(false);
                }}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <article ref={articleRef} className="space-y-8">
          {/* Article Header */}
          <header className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">{article.title}</h1>

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Par {article.author?.displayName || "Auteur"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date((article as any).publishedAt || article.createdAt || Date.now()).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{readingTime} min de lecture</span>
              </div>
            </div>

            {/* Cover Image */}
            {cover && (
              <div className="relative overflow-hidden rounded-xl shadow-2xl">
                <img
                  src={cover}
                  srcSet={coverSrcSet}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1024px"
                  alt="Cover"
                  className="w-full h-auto object-cover"
                  decoding="async"
                />
              </div>
            )}
          </header>

          {/* Article Content */}
          <div
            className="prose prose-slate dark:prose-invert lg:prose-lg xl:prose-xl max-w-none prose-headings:scroll-mt-20 prose-img:rounded-lg prose-img:shadow-md prose-a:text-blue-600 hover:prose-a:text-blue-700 dark:prose-a:text-blue-400 prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-headings:transition-all prose-headings:duration-300 [&_.highlight-heading]:text-blue-600 [&_.highlight-heading]:dark:text-blue-400"
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </article>

        {/* Article Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-8 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!canReact || reacting) return;
                likeMut.mutate();
              }}
              disabled={!canReact || reacting}
              title={!canReact ? "Connectez-vous pour liker" : undefined}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-60 ${
                reaction === "like"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              }`}
            >
              <Heart className={`w-4 h-4 ${reaction === "like" ? "fill-current" : ""}`} />
              <span>{showNumber(s?.likes)}</span>
            </button>

            <button
              onClick={() => {
                if (!canReact || reacting) return;
                dislikeMut.mutate();
              }}
              disabled={!canReact || reacting}
              title={!canReact ? "Connectez-vous pour disliker" : undefined}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-60 ${
                reaction === "dislike"
                  ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <ThumbsDown className={`w-4 h-4 ${reaction === "dislike" ? "fill-current" : ""}`} />
              <span>{showNumber(s?.dislikes)}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{showNumber(typeof viewsOverride === 'number' ? viewsOverride : s?.views)} vues</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{showNumber(s?.commentsCount)} commentaires</span>
            </div>
          </div>

        {/* Close Article Actions container */}
        </div>

        {/* Subscription Widget */}
        {article && article.author && (
          <ArticleSubscriptionWidget
            authorId={article.author.id}
            authorName={article.author.displayName}
            categoryId={article.category?.id}
            categoryName={article.category?.name}
          />
        )}

        {/* Comments Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Commentaires</h2>
            <button
              onClick={() => setShowComments((v) => !v)}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {showComments ? "Masquer" : `Afficher (${showNumber(s?.commentsCount)})`}
            </button>
          </div>
          {showComments && (
            <Suspense fallback={<div className="space-y-3"><div className="h-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></div>}>
              <LazyCommentForm articleId={id} />
              <LazyCommentList articleId={id} articleAuthorId={article.authorId} />
            </Suspense>
          )}
        </section>
      </div>
    </div>
  );
}
