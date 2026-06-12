/**
 * InfiniteScrollSentinel
 *
 * Sutil indicador de "loading more" para listas con scroll infinito.
 * Renderiza un nodo invisible (con ref) que el IntersectionObserver del
 * hook `useInfiniteScroll` observa para disparar la siguiente carga.
 *
 * Props:
 *   sentinelRef: ref del hook (obligatorio).
 *   hasMore:     boolean del hook. Si es false, no se pinta nada.
 *   label:       texto opcional ("Loading more..." por defecto).
 *   total:       total opcional para mostrar contador discreto.
 *   visibleCount: opcional, para "Showing X of Y".
 */
const InfiniteScrollSentinel = ({
  sentinelRef,
  hasMore,
  label = "Loading more...",
  total,
  visibleCount,
}) => {
  if (!hasMore) {
    if (typeof total === "number" && total > 0) {
      return (
        <div className="infinite-scroll-end" role="status" aria-live="polite">
          Showing all {total} {total === 1 ? "result" : "results"}
        </div>
      );
    }
    return null;
  }

  return (
    <div
      ref={sentinelRef}
      className="infinite-scroll-sentinel"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="infinite-scroll-spinner" aria-hidden="true" />
      <span className="infinite-scroll-label">
        {label}
        {typeof visibleCount === "number" &&
        typeof total === "number" &&
        total > 0 ? (
          <span className="infinite-scroll-count">
            {" "}
            ({visibleCount} / {total})
          </span>
        ) : null}
      </span>
    </div>
  );
};

export default InfiniteScrollSentinel;
