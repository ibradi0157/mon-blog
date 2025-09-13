'use client';

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-96 w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
    </div>
  );
}
