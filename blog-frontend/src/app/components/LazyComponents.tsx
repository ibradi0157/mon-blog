"use client";
import { lazy, Suspense, ComponentType, useState, useEffect, useRef } from 'react';

// Simple Skeleton component since ui/Skeleton might not exist
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
);

// Lazy loaded components for better performance
export const LazyArticleCard = lazy(() => 
  import('./ArticleCard').then(module => ({ default: module.ArticleCard }))
);

export const LazyProEditor = lazy(() => 
  import('./ProEditor').then(module => ({ default: module.ProEditor }))
);

// Note: These components will be created when dashboard modules are implemented
export const LazyHomepageBuilder = lazy(() => 
  Promise.resolve({ default: () => <div>Homepage Builder (Coming Soon)</div> })
);

export const LazyCommentsTable = lazy(() => 
  Promise.resolve({ default: () => <div>Comments Table (Coming Soon)</div> })
);

export const LazyArticlesTable = lazy(() => 
  Promise.resolve({ default: () => <div>Articles Table (Coming Soon)</div> })
);

// Loading components
const ArticleCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-slate-200 dark:bg-slate-700 h-48 rounded-lg mb-4"></div>
    <div className="space-y-2">
      <div className="bg-slate-200 dark:bg-slate-700 h-4 rounded w-3/4"></div>
      <div className="bg-slate-200 dark:bg-slate-700 h-4 rounded w-1/2"></div>
    </div>
  </div>
);

const EditorSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-slate-200 dark:bg-slate-700 h-12 rounded-t-lg"></div>
    <div className="bg-slate-100 dark:bg-slate-800 h-64 rounded-b-lg"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="bg-slate-200 dark:bg-slate-700 h-12 rounded"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-slate-100 dark:bg-slate-800 h-16 rounded"></div>
    ))}
  </div>
);

const BuilderSkeleton = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="bg-slate-200 dark:bg-slate-700 h-8 rounded w-1/3"></div>
        <div className="bg-slate-100 dark:bg-slate-800 h-64 rounded"></div>
      </div>
      <div className="space-y-4">
        <div className="bg-slate-200 dark:bg-slate-700 h-8 rounded w-1/3"></div>
        <div className="bg-slate-100 dark:bg-slate-800 h-64 rounded"></div>
      </div>
    </div>
  </div>
);

// Wrapper components with suspense
export const ArticleCardWithSuspense = (props: any) => (
  <Suspense fallback={<ArticleCardSkeleton />}>
    <LazyArticleCard {...props} />
  </Suspense>
);

export const ProEditorWithSuspense = (props: any) => (
  <Suspense fallback={<EditorSkeleton />}>
    <LazyProEditor {...props} />
  </Suspense>
);

export const HomepageBuilderWithSuspense = (props: any) => (
  <Suspense fallback={<BuilderSkeleton />}>
    <LazyHomepageBuilder {...props} />
  </Suspense>
);

export const CommentsTableWithSuspense = (props: any) => (
  <Suspense fallback={<TableSkeleton />}>
    <LazyCommentsTable {...props} />
  </Suspense>
);

export const ArticlesTableWithSuspense = (props: any) => (
  <Suspense fallback={<TableSkeleton />}>
    <LazyArticlesTable {...props} />
  </Suspense>
);

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  LoadingComponent: ComponentType = () => <Skeleton className="h-32 w-full" />
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Intersection Observer hook for lazy loading on scroll
export function useLazyLoad(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, hasLoaded]);

  return { ref, isVisible, hasLoaded };
}

// Lazy image component with intersection observer
export function LazyImage({ 
  src, 
  alt, 
  className = "", 
  threshold = 0.1,
  ...props 
}: {
  src: string;
  alt: string;
  className?: string;
  threshold?: number;
  [key: string]: any;
}) {
  const { ref, isVisible } = useLazyLoad(threshold);
  const [loaded, setLoaded] = useState(false);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={() => setLoaded(true)}
          {...props}
        />
      )}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
      )}
    </div>
  );
}
