import { type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/**
 * Skeleton placeholder block. Pakai untuk menggantikan teks "Memuat..."
 * agar layout tidak shift saat data masuk. `aria-label` wajib supaya
 * screen reader tahu sedang loading.
 */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
      {...rest}
    />
  );
}

interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /** Jumlah baris placeholder. Default 3. */
  lines?: number;
}

/** Beberapa baris Skeleton — meniru paragraph multi-line. */
export function SkeletonText({ lines = 3, className, ...rest }: SkeletonTextProps) {
  return (
    <div role="status" aria-live="polite" className={cn("space-y-2", className)} {...rest}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          data-skeleton-line
          className={cn(
            "h-3 animate-pulse rounded bg-muted/60",
            i === lines - 1 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </div>
  );
}
