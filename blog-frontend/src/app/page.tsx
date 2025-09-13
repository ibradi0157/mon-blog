"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Search, Clock, User, Calendar, ArrowRight, TrendingUp, BookOpen } from "lucide-react";
import { listPublicArticles, type Article } from "./services/articles";
import { getPublicHomepage } from "./services/homepage";
import type { Section } from "./services/homepage";
import { ArticleCard } from "./components/ArticleCard";
import { toAbsoluteImageUrl } from "./lib/api";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const hpQ = useQuery({
    queryKey: ["public-homepage"],
    queryFn: () => getPublicHomepage(),
  });

  const articlesQ = useQuery({
    queryKey: ["public-articles", { search: searchQuery }],
    queryFn: () => listPublicArticles({ page: 1, limit: 12, search: searchQuery || undefined }),
  });

  const hasSections = (hpQ.data?.data?.sections && hpQ.data.data.sections.length > 0) || false;
  const hasFeatured = (hpQ.data?.data?.featuredArticles && hpQ.data.data.featuredArticles.length > 0) || false;
  const needsFallback = !hasSections && !hasFeatured;

  if (hpQ.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hpQ.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Erreur de chargement</h2>
          <p className="text-slate-600 dark:text-slate-400">Impossible de charger la page d'accueil</p>
        </div>
      </div>
    );
  }

  const hp = hpQ.data?.data;
  const articles = articlesQ.data?.data ?? [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {!hasSections && (
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black/20"></div>
          {hp?.heroImageUrl && (
            <div className="absolute inset-0">
              <Image
                src={toAbsoluteImageUrl(hp.heroImageUrl) || '/placeholder-hero.jpg'}
                alt="Hero"
                fill
                className="object-cover"
                priority
                sizes="100vw"
                quality={85}
              />
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          )}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                {hp?.heroTitle || "Bienvenue sur Mon Blog"}
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
                {hp?.heroSubtitle || "Découvrez des articles passionnants sur la technologie, l'innovation et bien plus encore"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher des articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-slate-900 placeholder-slate-500"
                  />
                </div>
                <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2">
                  <span>Explorer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"></div>
        </section>
      )}

      {/* Sections Rendering */}
      {hasSections && (
        <div className="space-y-16">
          {hp!.sections!.map((section: Section, i: number) => (
            <div key={i}>{renderSection(section)}</div>
          ))}
        </div>
      )}

      {/* Articles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {needsFallback ? "Derniers Articles" : "Plus d'Articles"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Découvrez notre sélection d'articles récents
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <TrendingUp className="w-4 h-4" />
            <span>{articles.length} articles</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher des articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {articlesQ.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-200 dark:bg-slate-700 h-48 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="bg-slate-200 dark:bg-slate-700 h-4 rounded w-3/4"></div>
                  <div className="bg-slate-200 dark:bg-slate-700 h-4 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.id}
                title={article.title}
                coverUrl={article.coverUrl}
                thumbnails={article.thumbnails}
                createdAt={article.createdAt}
                author={article.author}
                content={article.content}
                category={article.category}
                isPublished={article.isPublished}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Aucun article trouvé
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {searchQuery ? "Essayez avec d'autres mots-clés" : "Aucun article disponible pour le moment"}
            </p>
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Restez informé
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Recevez nos derniers articles directement dans votre boîte mail
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-slate-900 placeholder-slate-500"
              />
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap">
                S'abonner
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function renderSection(s: Section) {
  if (s.kind === "hero") {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/20"></div>
        {s.imageUrl && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={toAbsoluteImageUrl(s.imageUrl)} alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        )}
        <div className="relative z-10 py-24 px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">{s.title}</h1>
          {(s.subtitle || s.text) && <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto drop-shadow">{s.subtitle || s.text}</p>}
          {s.buttonLabel && s.buttonHref && s.buttonHref.startsWith('/') ? (
            <Link href={s.buttonHref} className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              <span>{s.buttonLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : s.buttonLabel ? (
            <a href={s.buttonHref || "#"} className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              <span>{s.buttonLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          ) : null}
        </div>
      </section>
    );
  }

  if (s.kind === "featuredGrid") {
    const items = s.articles || [];
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {s.title && <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">{s.title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((article) => (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              coverUrl={article.coverUrl}
              thumbnails={article.thumbnails}
              createdAt={article.createdAt}
              author={article.author}
              content={article.content}
              category={article.category}
              isPublished={article.isPublished}
            />
          ))}
        </div>
      </section>
    );
  }

  if (s.kind === "categoryGrid") {
    const items = s.categories || [];
    const colors = [
      "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800",
      "bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800",
      "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800",
      "bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700 hover:from-pink-600 hover:via-pink-700 hover:to-pink-800",
      "bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800",
      "bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800",
    ];
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {s.title && <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">{s.title}</h2>}
        <div className="flex flex-wrap gap-6 justify-center">
          {items.map((c, idx) => (
            <Link
              key={c.id}
              href={`/articles?categoryId=${encodeURIComponent(c.id)}`}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${colors[idx % colors.length]} shadow-lg`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{c.name}</span>
            </Link>
          ))}
          {items.length === 0 && (
            <div className="text-slate-500 dark:text-slate-400">Aucune catégorie</div>
          )}
        </div>
      </section>
    );
  }

  if (s.kind === "html") {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: s.html }} />
      </section>
    );
  }

  if (s.kind === "spacer") {
    const h = s.size === "sm" ? "h-8" : s.size === "md" ? "h-16" : "h-32";
    return <div className={h} />;
  }

  if (s.kind === "cta") {
    return (
      <section className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">{s.title}</h2>
            {s.text && <p className="text-blue-100 mb-8 max-w-2xl mx-auto">{s.text}</p>}
            {s.buttonLabel && s.buttonHref && s.buttonHref.startsWith('/') ? (
              <Link href={s.buttonHref} className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                <span>{s.buttonLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : s.buttonLabel ? (
              <a href={s.buttonHref || "#"} className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                <span>{s.buttonLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
