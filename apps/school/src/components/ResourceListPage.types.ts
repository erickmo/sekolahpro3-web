import type { ReactNode } from "react";
import type { Column, SortState } from "@sekolahpro/ui";
import type { FilterTuple } from "@sekolahpro/api-client";
import type { SummaryItem } from "../lib/orang/listSummary";

/**
 * Public props for the shared {@link ResourceListPage}. Extracted from the
 * component file so the implementation stays small; the component re-exports
 * this type, so existing `import { ResourceListPageProps } from "./ResourceListPage"`
 * call sites keep working unchanged.
 */
export interface ResourceListPageProps<T extends Record<string, unknown>> {
  eyebrow?: string;
  title: string;
  description?: string;
  doctype: string;
  fields: string[];
  rowKey: (row: T) => string;
  columns: Column<T>[];
  defaultSort?: SortState;
  searchFields?: string[];
  selectFilters?: Array<{
    key: string;
    label: string;
    field: string;
    options: Array<{ value: string; label: string }>;
    /**
     * Controlled value. When provided, the filter operates in controlled mode and
     * `onChange` becomes the sole source of state updates (no internal mirror).
     * See PERP-ADR-0001 — required for URL-synced filters in /perpustakaan/peminjaman.
     */
    value?: string;
    /**
     * Controlled change handler. Required when `value` is set. Fires with the new
     * selected value (e.g. "Semua" sentinel) so the parent can sync URL/search state.
     * See PERP-ADR-0001.
     */
    onChange?: (value: string) => void;
  }>;
  /**
   * Extra filter clauses appended unconditionally to the list query (in addition to
   * `selectFilters` + search). Use for server-side scoping that the user cannot toggle
   * (e.g. `status in ["Aktif","Terlambat"]` for the default circulation view).
   * See PERP-ADR-0001.
   */
  baseFilters?: FilterTuple[];
  /**
   * Async post-processor invoked on each loaded page. Receives the visible rows and
   * returns a (possibly enriched / filtered) array used for render. Use to fetch
   * derived data per page (e.g. denda summary) without coupling to the list endpoint.
   * See PERP-ADR-0001.
   */
  decorateRows?: (rows: T[]) => Promise<T[]>;
  extraActions?: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  /**
   * Enables a server-side CSV export of ALL rows matching the current filters
   * (search + selectFilters + baseFilters), not just the visible page. Fetches
   * with pagination disabled, maps each row via `mapRow`, then downloads a CSV.
   */
  exportConfig?: {
    fileName: string;
    fields: string[];
    mapRow: (row: T) => Record<string, unknown>;
  };
  /**
   * Pure reducer that turns ALL base-scoped rows into a summary strip of
   * StatCards rendered just under the header. When set, the page runs a SECOND
   * list query (baseFilters only, all rows — NO search/selectFilter) so the
   * strip reflects the whole dataset, not the visible page. Backward compatible:
   * omit it and nothing changes.
   */
  summarize?: (allRows: T[]) => SummaryItem[];
  /**
   * Fields used by the summary count query. Defaults to `fields`. Provide a
   * narrower set when the summary only needs e.g. a single status column.
   */
  summaryFields?: string[];
  /**
   * Onboarding content shown INSTEAD of the FilterBar + table when the list is
   * truly first-run-empty (loaded, no error, zero rows, no search, no active
   * filter). A filtered/searched empty result keeps the normal in-table message.
   */
  gettingStarted?: ReactNode;
}
