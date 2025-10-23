"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User as UserIcon, Users, BookOpen, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/providers/AuthProvider";
import { FollowButton } from "@/app/components/FollowButton";

interface User {
  id: string;
  displayName: string;
  email: string;
  image?: string;
  role: string;
  bio?: string;
  _count: {
    articles: number;
    followers: number;
  };
}

export default function MembersPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Fetch users with filters
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users", { search: debouncedSearchTerm, role: roleFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (roleFilter !== "all") params.append("role", roleFilter);

      const res = await fetch(`/api/users/members?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      return json?.data ?? [];
    },
  });

  // Filter out current user from the list
  const filteredUsers = users.filter((user) => user.id !== currentUser?.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Découvrez nos auteurs
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Suivez vos auteurs préférés pour ne rien manquer de leurs publications
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4 md:flex md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un auteur..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-48">
            <select
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tous les rôles</option>
              <option value="AUTHOR">Auteurs</option>
              <option value="ADMIN">Administrateurs</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">Aucun membre trouvé</h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Essayez de modifier vos critères de recherche.</p>
          </div>
        )}

        {/* Users Grid */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.displayName}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <UserIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-4 h-4 border-2 border-white dark:border-slate-800"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                        <Link href={`/members/${user.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {user.displayName || user.email.split('@')[0]}
                        </Link>
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {user.bio && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {user.bio}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                        <BookOpen className="h-4 w-4" />
                        <span>{user._count.articles} articles</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                        <Users className="h-4 w-4" />
                        <span>{user._count.followers} abonnés</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 text-sm">
                      <FollowButton 
                        authorId={user.id} 
                        variant="compact" 
                        showCount={false}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t border-slate-200 dark:border-slate-700">
                  <Link 
                    href={`/members/${user.id}`} 
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Voir le profil
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
