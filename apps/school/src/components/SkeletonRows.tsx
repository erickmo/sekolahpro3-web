/**
 * Animated placeholder rows shown while a list query is loading its first page.
 * Pure presentational: deterministic pseudo-random widths keep the shimmer from
 * looking uniform without any state.
 * @param count number of skeleton rows to render
 * @param cols number of shimmer cells per row
 */
export function SkeletonRows({ count, cols }: { count: number; cols: number }) {
  return (
    <div className="divide-y divide-border" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 animate-pulse">
          {Array.from({ length: cols }).map((__, j) => (
            <div
              key={j}
              className="h-3 rounded bg-muted"
              style={{ width: `${60 + ((i * 7 + j * 13) % 30)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
