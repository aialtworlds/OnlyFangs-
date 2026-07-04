import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * useInfiniteScroll - Hook for infinite scroll pagination
 * Triggers callback when user scrolls near bottom of page
 */
export function useInfiniteScroll({
  onLoadMore,
  threshold = 200,
  enabled = true,
}: UseInfiniteScrollOptions) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!enabled || !observerTarget.current) return;

    const element = observerTarget.current;
    const rect = element.getBoundingClientRect();
    const isNearBottom = rect.bottom <= window.innerHeight + threshold;

    if (isNearBottom) {
      onLoadMore();
    }
  }, [onLoadMore, threshold, enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll, enabled]);

  return observerTarget;
}
