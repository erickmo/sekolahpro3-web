// Active-sekolah → Vernon Accounting `company` scoping.
//
// Vernon Accounting doctypes are tenanted by `company`, not `sekolah`.
// Convention: the Frappe Company doc-id mirrors the active Sekolah's
// doc-id (e.g. Sekolah `sd-aletheia-malang` ⇒ Company `sd-aletheia-malang`).
// Backend admins must ensure a Company exists with the same name for each
// Sekolah before akuntansi data can be created.
//
// All akuntansi routes call `useActiveCompany()` to derive the filter and
// pre-fill `company` fields on create forms — there is no manual input.

import { useSessionStore } from "@sekolahpro/auth";
import type { FilterTuple } from "@sekolahpro/api-client";

export function useActiveCompany(): string {
  return useSessionStore((s) => s.activeSekolah?.name ?? "");
}

// Adds `["company", "=", <company>]` to an existing filter list unless the
// caller already specified a company filter. Returns the original filters
// untouched when company is empty (e.g. no active sekolah selected yet).
export function withCompanyFilter(
  filters: FilterTuple[] | undefined,
  company: string,
): FilterTuple[] {
  if (!company) return filters ?? [];
  const base = filters ?? [];
  if (base.some((f) => f[0] === "company" || (f.length === 4 && f[1] === "company"))) {
    return base;
  }
  return [...base, ["company", "=", company]];
}

// Scope filter for e-Faktur Export. Unlike its sibling tax doctypes
// (SPT Masa PPN, Withholding Tax Entry), e-Faktur Export has NO `company`
// field of its own, so it cannot be filtered by company directly. We scope it
// indirectly through its `tax_period` link — Tax Period IS company-scoped — by
// passing the company's Tax Period names. Returns an empty filter when no
// company is active (admin context sees all). The canonical fix is a backend
// `company` field on the doctype; this is the FE-side tenant guard until then.
export function efakturScopeFilter(company: string, periodNames: string[]): FilterTuple[] {
  if (!company) return [];
  return [["tax_period", "in", periodNames]];
}
