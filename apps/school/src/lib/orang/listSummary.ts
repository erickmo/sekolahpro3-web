// Pure, defensive helpers for the list-page summary strip + first-run
// onboarding empty-state. No hooks, no I/O — safe to unit-test in isolation.
//
// Layer: domain helper (number-crunching + a boolean predicate only). The
// ResourceListPage wiring fetches rows and a page passes a `summarize` closure
// built from these helpers. Rows may have missing/blank fields — values are
// bucketed, never thrown on.

/** Tone palette a summary StatCard can use. `neutral` means "no accent". */
export type SummaryTone = "brand" | "emerald" | "amber" | "rose" | "violet" | "neutral";

/** One cell of the summary strip: a labelled count with an optional tone/hint. */
export interface SummaryItem {
  label: string;
  value: number;
  tone?: SummaryTone;
  hint?: string;
}

/** Bucket label for any missing/blank dimension value. */
const OTHER_BUCKET = "Lainnya";

/**
 * Read a string field off a row, trimming and bucketing missing/blank values.
 * @param row source record
 * @param field field name to read (keyof or a plain string)
 * @returns the trimmed value, or the "Lainnya" bucket when absent/blank
 */
function readBucketed<T>(row: T, field: keyof T | string): string {
  const raw = (row as Record<string, unknown>)[field as string];
  const value = typeof raw === "string" ? raw.trim() : "";
  return value.length > 0 ? value : OTHER_BUCKET;
}

/**
 * Tally a single string field across all rows into a label->count map.
 * @param rows source records (may be empty / partially filled)
 * @param field field to count by; missing/blank values fold into "Lainnya"
 * @returns {} on empty input; never throws
 */
export function countBy<T>(rows: T[], field: keyof T | string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const key = readBucketed(row, field);
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/**
 * Build the ordered list of labels: requested order first (only those present
 * in counts), then any remaining keys in their natural object order.
 */
function orderedLabels(counts: Record<string, number>, order?: string[]): string[] {
  const present = new Set(Object.keys(counts));
  const head = (order ?? []).filter((k) => present.has(k));
  const tail = Object.keys(counts).filter((k) => !head.includes(k));
  return [...head, ...tail];
}

/**
 * Turn a label->count map into ordered SummaryItem[] for the strip.
 * @param counts label->count map (e.g. from countBy)
 * @param order optional label order applied first; unknown labels follow
 * @param tones optional label->tone map; unmapped labels get an undefined tone
 * @returns [] on empty counts; one SummaryItem per count entry, ordered
 */
export function toSummary(
  counts: Record<string, number>,
  order?: string[],
  tones?: Record<string, SummaryTone>,
): SummaryItem[] {
  return orderedLabels(counts, order).map((label) => {
    const tone = tones?.[label];
    return tone === undefined
      ? { label, value: counts[label] ?? 0 }
      : { label, value: counts[label] ?? 0, tone };
  });
}

/** State snapshot a list page hands to {@link isFirstRunEmpty}. */
export interface ListEmptyState {
  isLoading: boolean;
  isError: boolean;
  rowCount: number;
  hasSearch: boolean;
  hasActiveFilter: boolean;
}

/**
 * Decide whether a list is in its "first run" state — genuinely empty with no
 * active search or filter — so the page can greet the user with onboarding
 * guidance instead of a bare table. A filtered/searched empty result is NOT
 * first-run (the user just narrowed too far), so it stays false in that case.
 * @param s loading/error/row/search/filter snapshot
 * @returns true only when loaded, no error, zero rows, no search, no filter
 */
export function isFirstRunEmpty(s: ListEmptyState): boolean {
  return (
    !s.isLoading && !s.isError && s.rowCount === 0 && !s.hasSearch && !s.hasActiveFilter
  );
}
