import React from 'react';

/**
 * ContentSkeleton - Skeleton loading component for content cards
 * Displays animated placeholder while content is loading
 */
export function ContentSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-muted"></div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-4 bg-muted rounded w-3/4"></div>

        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-full"></div>
          <div className="h-3 bg-muted rounded w-5/6"></div>
        </div>

        {/* Creator info skeleton */}
        <div className="flex items-center gap-2 pt-2">
          <div className="w-8 h-8 bg-muted rounded-full"></div>
          <div className="h-3 bg-muted rounded w-32"></div>
        </div>

        {/* Footer skeleton */}
        <div className="flex justify-between pt-2">
          <div className="h-3 bg-muted rounded w-16"></div>
          <div className="h-3 bg-muted rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * ContentSkeletonGrid - Grid of skeleton loaders
 * @param count - Number of skeleton items to display
 */
export function ContentSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ContentSkeleton key={i} />
      ))}
    </div>
  );
}
