"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { User as UserIcon, BookOpen, Users, Calendar, Clock, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
// Removed date-fns to avoid version/signature issues; using Intl.DateTimeFormat instead
import { FollowButton } from "@/app/components/FollowButton";
import { ArticleCard } from "@/app/components/ArticleCard";
import { useAuth } from "@/app/providers/AuthProvider";
import { useState } from "react";

interface User {
  id: string;
  displayName: string;
  email: string;
  image?: string;
  bio?: string;
  role: string;
  createdAt: string;
  avatar?: string;
  _count: {
    articles: number;
    followers: number;
    following: number;
  };
}

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  slug: string;
  coverImage?: string;
  publishedAt: string;
  readTime?: number;
  views: number;
  likes: number;
  commentsCount: number;
  content?: string;
  category?: {
    id: string;
    name: string;
    slug?: string;
  };
  author?: {
    id: string;
    displayName: string;
    avatar?: string;
  };
}

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'articles' | 'about'>('articles');

  // Fetch user data
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: [`user-${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/public/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Utilisateur non trouvé");
        }
        throw new Error("Erreur lors du chargement du profil");
      }
      return res.json();
    },
  });

  // Fetch user's articles
  const { data: articles = [], isLoading: isLoadingArticles } = useQuery<Article[]>({
    queryKey: [`user-articles-${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/public/${id}/articles`);
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data ?? [];
    },
    enabled: !!user && activeTab === 'articles',
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
              </div>
            </div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">Erreur</h2>
            <p className="mt-2 text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : "Une erreur est survenue"}
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-800 dark:text-slate-200 transition-colors inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Utilisateur non trouvé</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            L'utilisateur que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === user.id;
  const joinDate = new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header with cover and profile */}
      <div className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="pt-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour
            </button>
          </div>

          {/* Profile header */}
          <div className="py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.displayName}
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg">
                      <UserIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 bg-green-500 rounded-full w-5 h-5 border-2 border-white dark:border-slate-800"></span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {user.displayName || user.email.split('@')[0]}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Membre depuis {joinDate}
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm">{user._count.articles} articles</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{user._count.followers} abonnés</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isCurrentUser && (
                <div className="mt-6 md:mt-0">
                    <div className="px-6 py-2.5 text-base">
                      <FollowButton 
                        authorId={user.id} 
                        variant="default" 
                        showCount={false}
                      />
                    </div>
                </div>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="mt-6 max-w-3xl">
                <p className="text-slate-700 dark:text-slate-300">{user.bio}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="mt-8 border-b border-slate-200 dark:border-slate-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('articles')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'articles'
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  Articles
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'about'
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  À propos
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'articles' ? (
          <div className="space-y-6">
            {isLoadingArticles ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
                    <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => {
                  const baseProps = {
                    id: article.id,
                    title: article.title,
                    coverUrl: article.coverImage || null,
                    createdAt: article.publishedAt,
                    author: {
                      id: user.id,
                      displayName: user.displayName || 'Auteur inconnu',
                      avatarUrl: user.image || undefined,
                    },
                  };

                  if (article.category) {
                    return (
                      <ArticleCard
                        key={article.id}
                        {...baseProps}
                        category={{ id: article.category.id, name: article.category.name }}
                      />
                    );
                  }

                  return <ArticleCard key={article.id} {...baseProps} />;
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">Aucun article publié</h3>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  {isCurrentUser
                    ? "Vous n'avez pas encore publié d'articles. Commencez à écrire dès maintenant !"
                    : "Cet utilisateur n'a pas encore publié d'articles."}
                </p>
                {isCurrentUser && (
                  <div className="mt-6">
                    <Link
                      href="/dashboard/articles/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Écrire un article
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">À propos</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</h3>
                <p className="mt-1 text-slate-900 dark:text-white">{user.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Membre depuis</h3>
                <p className="mt-1 text-slate-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Statut</h3>
                <p className="mt-1 text-slate-900 dark:text-white">
                  {user.role === 'ADMIN' ? 'Administrateur' : 'Auteur'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Activité</h3>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user._count.articles}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Articles publiés</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{user._count.followers}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Abonnés</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{user._count.following}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Abonnements</p>
                  </div>
                </div>
              </div>
            </div>
            
            {isCurrentUser && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Link
                  href="/dashboard/profile"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Modifier le profil
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
