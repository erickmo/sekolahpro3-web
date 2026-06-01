import { useMemo } from "react";
import { useResourceList, type FilterTuple, type ListParams } from "@sekolahpro/api-client";
import { SummaryStrip } from "./SummaryStrip";
import type { SummaryItem } from "../lib/orang/listSummary";

// limit_page_length: 0 = "all rows" in Frappe — the strip summarises the WHOLE
// dataset (baseFilters only), independent of the user's search/select filters.
const ALL_ROWS = 0;

export interface ListSummaryProps<T extends Record<string, unknown>> {
  doctype: string;
  /** Fields needed to compute the summary counts. */
  summaryFields: string[];
  /** Server-side scoping the user cannot toggle (e.g. tenant/status base scope). */
  baseFilters?: FilterTuple[];
  /** Pure reducer turning every base-scoped row into the strip's cells. */
  summarize: (allRows: T[]) => SummaryItem[];
}

/**
 * Self-contained summary strip for a list page. Runs its OWN unconditional
 * list query (base filters only, all rows) so the hook count stays stable, then
 * renders a <SummaryStrip>. The host renders this unconditionally; gating on
 * whether a summary exists happens one level up (this whole component is only
 * mounted when `summarize` is provided), never inside a hook.
 */
export function ListSummary<T extends Record<string, unknown>>({
  doctype,
  summaryFields,
  baseFilters,
  summarize,
}: ListSummaryProps<T>) {
  const params: ListParams = useMemo(
    () => ({
      fields: summaryFields,
      ...(baseFilters && baseFilters.length ? { filters: baseFilters } : {}),
      limit_page_length: ALL_ROWS,
    }),
    [summaryFields, baseFilters],
  );

  const q = useResourceList<T>(doctype, params);
  const items = useMemo(() => summarize(q.data ?? []), [q.data, summarize]);
  return <SummaryStrip items={items} />;
}
