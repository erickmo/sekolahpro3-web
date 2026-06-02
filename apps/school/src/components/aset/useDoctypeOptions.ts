/**
 * Shared hook: load a tenant-scoped doctype's rows as SearchableSelect options.
 *
 * Used by every Manajemen Aset form modal that links to a master (kategori,
 * lokasi, aset) — extracted here to avoid repeating the list query + mapping in
 * each modal. The active-school header is applied automatically by the
 * api-client for tenanted doctypes, so no explicit sekolah filter is needed.
 */
import { useMemo } from "react";
import { useResourceList } from "@sekolahpro/api-client";
import type { SearchableOption } from "@sekolahpro/ui";

interface Row {
  name: string;
  [field: string]: unknown;
}

/**
 * @param doctype     Frappe doctype to list.
 * @param labelField  Field used as the option label (falls back to `name`).
 * @param extraFilters Optional fixed filters (e.g. only Aktif locations).
 */
export function useDoctypeOptions(
  doctype: string,
  labelField: string,
  extraFilters?: Array<[string, string, unknown]>,
): { options: SearchableOption[]; isLoading: boolean } {
  const q = useResourceList<Row>(doctype, {
    fields: ["name", labelField],
    limit_page_length: 0,
    ...(extraFilters ? { filters: extraFilters } : {}),
  });
  const options = useMemo<SearchableOption[]>(
    () =>
      (q.data ?? []).map((r) => ({
        value: r.name,
        label: (r[labelField] as string) || r.name,
        hint: r.name,
      })),
    [q.data, labelField],
  );
  return { options, isLoading: q.isLoading };
}
