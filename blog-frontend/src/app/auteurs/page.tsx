"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Users, BookOpen, Eye, TrendingUp, Award, MapPin, Calendar, Mail } from 'lucide-react';
import { api } from '../lib/api';

interface Author {
  id: string;
  displayName: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  articlesCount: number;
  totalViews: number;
  role: string;
  createdAt: string;
}

async function getPublicAuthors() {
  const { data } = await api.get('/users/authors');
  return data as { success: boolean; data: Author[] };
}

export default function AuthorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'articles' | 'views'>('articles');

  const authorsQ = useQuery({
    queryKey: ['public-authors'],
    queryFn: getPublicAuthors,
  });

  const authors = authorsQ.data?.data || [];

  // Filter and sort
  const filteredAuthors = authors
    .filter(a => 
      a.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.bio?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return (a.displayName || '').localeCompare(b.displayName || '');
      if (sortBy === 'articles') return (b.articlesCount || 0) - (a.articlesCount || 0);
      if (sortBy === 'views') return (b.totalViews || 0) - (a.totalViews || 0);
      return 0;
    });

  const topAuthors = filteredAuthors.slice(0, 3);
  const otherAuthors = filteredAuthors.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {authors.length} Auteurs Talentueux
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-100 dark:to-white bg-clip-text text-transparent leading-tight">
              Découvrez Nos Auteurs
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              Une communauté passionnée de créateurs de contenu qui partagent leur expertise et leurs connaissances avec vous.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="search"
                  placeholder="Rechercher un auteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              {/* Sort Buttons */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">Trier par:</span>
                {[
                  { value: 'articles', label: 'Articles', icon: BookOpen },
                  { value: 'views', label: 'Vues', icon: Eye },
                  { value: 'name', label: 'Nom', icon: Users },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sortBy === value
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top 3 Authors */}
        {topAuthors.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Award className="w-7 h-7 text-yellow-500" />
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Top Auteurs</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {topAuthors.map((author, idx) => (
                <Link
                  key={author.id}
                  href={`/auteurs/${author.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                      idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                      'bg-gradient-to-br from-orange-400 to-orange-600'
                    }`}>
                      {idx + 1}
                    </div>
                  </div>

                  <div className="p-6 pt-16">
                    {/* Avatar */}
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full animate-pulse opacity-50" />
                      <div className="relative w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white dark:ring-slate-800 shadow-xl">
                        {author.displayName?.charAt(0) || '?'}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-center mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {author.displayName || 'Auteur'}
                    </h3>

                    {author.bio && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4 line-clamp-2">
                        {author.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-semibold">{author.articlesCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Eye className="w-4 h-4" />
                        <span className="font-semibold">{author.totalViews?.toLocaleString('fr-FR') || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Other Authors */}
        {otherAuthors.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Tous Les Auteurs</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherAuthors.map((author) => (
                <Link
                  key={author.id}
                  href={`/auteurs/${author.id}`}
                  className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold ring-2 ring-blue-200 dark:ring-blue-900 group-hover:ring-4 transition-all">
                          {author.displayName?.charAt(0) || '?'}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {author.displayName || 'Auteur'}
                        </h3>
                        
                        {author.bio && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {author.bio}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {author.articlesCount} articles
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {author.totalViews?.toLocaleString('fr-FR') || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredAuthors.length === 0 && !authorsQ.isLoading && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Aucun auteur trouvé
            </h3>
            <p className="text-slate-500 dark:text-slate-500">
              Essayez avec d'autres mots-clés
            </p>
          </div>
        )}

        {/* Loading State */}
        {authorsQ.isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
