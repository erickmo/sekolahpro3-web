// Shared async option loader for Frappe Link fields (SearchableSelect
// `loadOptions`). One implementation replaces the per-modal copies that had
// drifted apart (and in one case searched a non-existent column).
import { listResource } from "@sekolahpro/api-client";
import type { SearchableOption } from "@sekolahpro/ui";

const SEARCH_LIMIT = 20;

/**
 * Search `doctype` by name OR `labelField`, returning SearchableSelect
 * options labeled "label (name)". Tenant scoping rides on listResource.
 */
export async function searchLink(
  doctype: string,
  labelField: string,
  q: string,
  extraFilters?: Array<[string, string, unknown]>,
): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(doctype, {
    fields: labelField === "name" ? ["name"] : ["name", labelField],
    ...(extraFilters ? { filters: extraFilters } : {}),
    ...(q
      ? {
          or_filters: [
            ["name", "like", `%${q}%`],
            [labelField, "like", `%${q}%`],
          ] as [string, string, unknown][],
        }
      : {}),
    limit_page_length: SEARCH_LIMIT,
    order_by: "modified desc",
  });
  return rows.map((r) => ({
    value: r.name ?? "",
    label:
      labelField !== "name" && r[labelField]
        ? `${r[labelField]} (${r.name})`
        : (r.name ?? ""),
  }));
}
