import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * useInfiniteScroll Hook
 *
 * Client-side infinite scroll for arrays already loaded in memory.
 * Renders `visibleCount` items, increments it when an IntersectionObserver
 * detects the sentinel element entering the viewport.
 *
 * Pattern:
 *   const { visibleItems, hasMore, sentinelRef, reset } = useInfiniteScroll(sortedItems, {
 *       initialCount: 12,
 *       step: 12,
 *       resetKey: `${searchTerm}|${statusFilter}|${sortConfig.key}|${sortConfig.direction}`,
 *   });
 *
 * - `initialCount` items render on first paint.
 * - `step` items are appended each time the sentinel becomes visible.
 * - `resetKey` is a string; whenever it changes the visible count goes back
 *   to `initialCount` (use it to wire search/filters/sort/tab changes).
 *
 * Returns:
 *   visibleItems: items.slice(0, visibleCount)
 *   visibleCount: number
 *   hasMore:      visibleCount < items.length
 *   sentinelRef:  attach to a div at the bottom of the list
 *   reset():      manual reset back to initialCount
 *   loadMore():   manual nudge (used by the observer)
 */
const useInfiniteScroll = (items = [], options = {}) => {
  const {
    initialCount = 12,
    step = 12,
    resetKey = "",
    rootMargin = "200px",
    threshold = 0,
    enabled = true,
  } = options;

  const total = items.length;
  const [visibleCount, setVisibleCount] = useState(
    Math.min(initialCount, total),
  );
  const sentinelRef = useRef(null);

  // Reset when the dataset shrinks below visibleCount, when the resetKey
  // changes (search/filter/sort/tab) or when initialCount changes.
  useEffect(() => {
    setVisibleCount(Math.min(initialCount, total));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, initialCount]);

  // Keep visibleCount in sync if the array length itself shrinks.
  useEffect(() => {
    setVisibleCount((prev) => {
      if (prev > total) return Math.min(initialCount, total);
      if (prev === 0 && total > 0) return Math.min(initialCount, total);
      return prev;
    });
  }, [total, initialCount]);

  const hasMore = visibleCount < total;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + step, total));
  }, [step, total]);

  const reset = useCallback(() => {
    setVisibleCount(Math.min(initialCount, total));
  }, [initialCount, total]);

  // Wire the IntersectionObserver to the sentinel element.
  useEffect(() => {
    if (!enabled) return undefined;
    if (!hasMore) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;

    // Fallback for very old browsers / SSR without IO.
    if (typeof IntersectionObserver === "undefined") {
      loadMore();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            loadMore();
            break;
          }
        }
      },
      { root: null, rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, hasMore, loadMore, rootMargin, threshold]);

  const visibleItems = useMemo(
    () => (visibleCount >= total ? items : items.slice(0, visibleCount)),
    [items, visibleCount, total],
  );

  return {
    visibleItems,
    visibleCount,
    hasMore,
    sentinelRef,
    loadMore,
    reset,
  };
};

export default useInfiniteScroll;
