'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Eye, Heart, User } from 'lucide-react';
import { toAbsoluteImageUrl } from '../lib/api';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  coverUrl?: string;
  publishedAt: string;
  viewCount?: number;
  likeCount?: number;
  author?: {
    displayName: string;
    avatarUrl?: string;
  };
  tags?: string[];
}

interface FeaturedArticlesCarouselProps {
  articles: Article[];
  autoPlayInterval?: number;
  transition?: 'slide' | 'fade' | 'zoom';
  speed?: number; // ms
  autoPlay?: boolean;
}

export function FeaturedArticlesCarousel({ articles, autoPlayInterval = 5000, transition = 'slide', speed, autoPlay = true }: FeaturedArticlesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  }, [articles.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    const intervalMs = speed ?? autoPlayInterval;
    if (!isAutoPlaying || articles.length <= 1) return;

    const interval = setInterval(goToNext, intervalMs);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, goToNext, articles.length, speed]);

  if (!articles || articles.length === 0) {
    return null;
  }

  const currentArticle = articles[currentIndex];

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden group">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {currentArticle.coverUrl ? (
          <img
            src={toAbsoluteImageUrl(currentArticle.coverUrl)}
            alt={currentArticle.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
        {/* Tags */}
        {currentArticle.tags && currentArticle.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {currentArticle.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white border border-white/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <Link href={`/article/${currentArticle.id}`}>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 hover:text-blue-300 transition-colors line-clamp-2">
            {currentArticle.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {currentArticle.excerpt && (
          <p className="text-lg text-white/90 mb-6 line-clamp-2 max-w-3xl">
            {currentArticle.excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm">
          {currentArticle.author && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {currentArticle.author.displayName?.charAt(0) || '?'}
              </div>
              <span className="font-medium">{currentArticle.author.displayName}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{new Date(currentArticle.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          {currentArticle.viewCount !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{currentArticle.viewCount.toLocaleString('fr-FR')}</span>
            </div>
          )}

          {currentArticle.likeCount !== undefined && currentArticle.likeCount > 0 && (
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{currentArticle.likeCount}</span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <Link
          href={`/article/${currentArticle.id}`}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-fit"
        >
          Lire l'article
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Navigation Arrows */}
      {articles.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Article précédent"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Article suivant"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {articles.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {articles.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${
                index === currentIndex
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/70'
              } rounded-full`}
              aria-label={`Aller à l'article ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-play Toggle */}
      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="absolute top-4 right-4 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs font-medium text-white transition-all"
      >
        {isAutoPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
