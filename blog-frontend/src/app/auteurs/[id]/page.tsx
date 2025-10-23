"use client";

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Eye, Calendar, Mail, MapPin, Award, TrendingUp, Heart, MessageCircle, Clock } from 'lucide-react';
import { api, toAbsoluteImageUrl } from '../../lib/api';
import { FollowButton } from '../../components/FollowButton';

interface AuthorProfile {
  id: string;
  displayName: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  role: string;
  createdAt: string;
  articlesCount: number;
  totalViews: number;
  totalLikes: number;
  articles: Array<{
    id: string;
    title: string;
    excerpt?: string;
    coverImage?: string;
    publishedAt: string;
    viewCount: number;
    commentCount: number;
    tags: string[];
  }>;
}

async function getAuthorProfile(id: string) {
  const { data } = await api.get(`/users/authors/${id}`);
  return data as { success: boolean; data: AuthorProfile };
}

export default function AuthorProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const profileQ = useQuery({
    queryKey: ['author-profile', id],
    queryFn: () => getAuthorProfile(id),
    enabled: !!id,
  });

  const author = profileQ.data?.data;

  if (profileQ.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Auteur introuvable</h1>
          <Link href="/auteurs" className="text-blue-600 hover:text-blue-700">
            ← Retour aux auteurs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Back Button */}
          <Link
            href="/auteurs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white transition-all mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour aux auteurs
          </Link>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-pink-400 rounded-full blur-2xl opacity-50 animate-pulse" />
              <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-5xl md:text-6xl font-bold ring-8 ring-white/20 shadow-2xl">
                {author.displayName?.charAt(0) || '?'}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
                {author.displayName || 'Auteur'}
              </h1>
              
              {author.bio && (
                <p className="text-xl text-blue-100 dark:text-blue-200 mb-6 max-w-2xl">
                  {author.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">{author.articlesCount}</div>
                    <div className="text-xs text-blue-100">Articles</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">{author.totalViews?.toLocaleString('fr-FR') || 0}</div>
                    <div className="text-xs text-blue-100">Vues totales</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Heart className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">{author.totalLikes?.toLocaleString('fr-FR') || 0}</div>
                    <div className="text-xs text-blue-100">Likes</div>
                  </div>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mt-6">
                <div className="flex items-center gap-2 text-blue-100">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Membre depuis {new Date(author.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                
                {/* Follow Button */}
                <FollowButton 
                  authorId={author.id} 
                  authorName={author.displayName}
                  variant="default"
                  showCount={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Articles de {author.displayName}
          </h2>
        </div>

        {author.articles && author.articles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {author.articles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="group bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 overflow-hidden hover:-translate-y-1"
              >
                {/* Cover Image */}
                {article.coverImage && (
                  <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
                    <img
                      src={toAbsoluteImageUrl(article.coverImage)}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  {article.excerpt && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {article.viewCount?.toLocaleString('fr-FR') || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {article.commentCount || 0}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(article.publishedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              Cet auteur n'a pas encore publié d'articles.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
