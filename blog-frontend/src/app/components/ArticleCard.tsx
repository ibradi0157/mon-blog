"use client";
import Link from "next/link";
import { Clock, Calendar, User, ArrowRight, BookOpen, Eye } from "lucide-react";
import { toAbsoluteImageUrl, buildSrcSet } from "../lib/api";

export function ArticleCard({
  id,
  title,
  coverUrl,
  thumbnails = [],
  createdAt,
  author,
  content,
  category,
  isPublished = true,
}: {
  id: string;
  title: string;
  coverUrl?: string | null;
  thumbnails?: string[];
  createdAt?: string;
  author?: { id: string; displayName: string; avatarUrl?: string | null } | null;
  content?: string;
  category?: { id: string; name: string } | null;
  isPublished?: boolean;
}) {
  const src = toAbsoluteImageUrl(coverUrl);
  const srcSet = buildSrcSet(thumbnails);

  const readingTime = Math.ceil((content?.length || 0) / 1000);

  return (
    <Link href={`/article/${id}`} className="group block">
      <article className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-sm shadow-black/5 hover:shadow-lg hover:shadow-black/10 transition-transform duration-300 overflow-hidden h-full group-hover:-translate-y-0.5">
        {/* Cover Image */}
        <div className="aspect-video overflow-hidden relative">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={src} 
              srcSet={srcSet} 
              sizes="(max-width: 600px) 400px, 800px" 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white/80" />
            </div>
          )}
          
          {/* Status Badge */}
          {!isPublished && (
            <div className="absolute top-3 left-3">
              <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Brouillon
              </span>
            </div>
          )}
          
          {/* Category Badge */}
          {category && (
            <div className="absolute top-3 right-3">
              <span className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-900 dark:text-white px-2 py-1 rounded-full text-xs font-medium">
                {category.name}
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Meta Information */}
          <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
            {readingTime > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{readingTime} min</span>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(createdAt).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
            {title}
          </h3>
          
          {/* Author and Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {author?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={toAbsoluteImageUrl(author.avatarUrl)}
                  alt={author.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {author?.displayName?.charAt(0) || 'A'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {author?.displayName || 'Auteur anonyme'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              <Eye className="w-4 h-4" />
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
