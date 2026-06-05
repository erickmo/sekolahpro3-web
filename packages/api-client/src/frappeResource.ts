import { useMutation, useQuery, type UseQueryOptions } from "@tanstack/react-query";

type Config = {
  baseUrl: string;
  csrfToken?: string;
  getActiveSekolah?: () => string | null | undefined;
};

let cfg: Config = { baseUrl: "" };

// Request header carrying the active Sekolah's doc-ID. The backend
// (`sekolahpro.api.tenant_scope.auto_set_tenant`) reads this header on every
// write to populate `sekolah`/`organisasi`, and validates it against the
// user's memberships. Sent on ALL requests so server-side scoping never has
// to fall back to guessing the tenant from the session.
export const ACTIVE_SEKOLAH_HEADER = "X-Active-Sekolah";

export function configureResource(next: Partial<Config>) {
  cfg = { ...cfg, ...next };
}

export class FrappeResourceError extends Error {
  constructor(public status: number, public payload: unknown, msg: string) {
    super(msg);
    this.name = "FrappeResourceError";
  }
}

// Thrown when a fetched doc does not belong to the active sekolah. Routes
// catch this and render the 404 page so cross-tenant deep links never leak
// data across schools.
export class TenantMismatchError extends Error {
  constructor(public doctype: string, public name: string) {
    super(`Doc ${doctype}/${name} is not in the active sekolah`);
    this.name = "TenantMismatchError";
  }
}

// Doctypes that have NO `sekolah` link field — global/master data shared
// across all schools. Auto-scope injection is skipped for these.
const TENANT_BLOCKLIST = new Set<string>([
  "Tahun Ajaran",
  "Semester",
  "User",
  "Role",
  "DocType",
  "Modul",
  "Feature Flag",
  "Organisasi",
  "Sekolah",
  // vernon_ads — platform-level ad doctypes; no `sekolah` field. Without this,
  // auto-injected tenant filters target a non-existent column and break lists.
  "Property",
  "Property Group",
  "Ad Slot",
  "Campaign",
  "Ad Creative",
  "Ad Event",
  "Ads Customer",
  "File",
  "Communication",
  // ORG_ONLY tier (ADR-0043) — anchored by `organisasi`, no `sekolah` column.
  // The provider/SaaS console queries these by `organisasi`; injecting a
  // `sekolah` filter would target a non-existent column → empty result.
  // (`Organisasi` itself is already listed above.)
  "Langganan",
  "Invoice Tenant",
  // Child tables tenanted via their parent (istable=1, no own `sekolah` field).
  // Injecting a `sekolah` filter would target a non-existent column → empty
  // result. Scope is enforced through the parent doc instead.
  "Fasilitas Ruangan",
  // Vernon Accounting doctypes — tenanted by `company`, not `sekolah`.
  // Until Sekolah↔Company mapping is wired, callers pass `company`
  // filters explicitly; auto-injection of `sekolah` would break queries.
  "Account",
  "Account Party Type",
  "Journal Entry",
  "Journal Entry Account",
  "Payment Entry",
  "Payment Entry Reference",
  "GL Entry",
  "Opening Balance Entry",
  "Opening Balance Entry Account",
  "Period Closing Voucher",
  "Budget",
  "Budget Account",
  "Budget Amendment",
  "Budget Amendment Detail",
  "Cost Center",
  "Accounting Dimension",
  "SPT Masa PPN",
  "e-Faktur Export",
  "Withholding Tax Entry",
  "PPh 21 TER Rate",
  "PPh 4a2 Rate",
  "Tax Period",
  "Tax Template",
  "Tax Template Detail",
  "Fiscal Year",
  "Accounting Period",
  "Currency Exchange",
  "Vernon Accounting Settings",
]);

export function isTenantedDoctype(doctype: string): boolean {
  return !TENANT_BLOCKLIST.has(doctype);
}

// Returns the active Sekolah's doc-ID (the value stored in `sekolah` link
// fields server-side), NOT the URL slug. Filters/comparisons must use the
// doc-ID because Frappe's link fields point to primary keys.
function activeSekolah(): string | null {
  const s = cfg.getActiveSekolah?.();
  return s ?? null;
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Frappe-CSRF-Token": cfg.csrfToken ?? "",
    [ACTIVE_SEKOLAH_HEADER]: activeSekolah() ?? "",
    ...(extra ?? {}),
  };
}

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const base = `${cfg.baseUrl}/api/resource/${path}`;
  if (!query) return base;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    sp.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: "include",
    headers: buildHeaders(),
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new FrappeResourceError(res.status, json, `Frappe ${method} ${url} failed: ${res.status}`);
  }
  return (json as { data: T }).data;
}

// Frappe REST filter tuple. The 3-tuple `[field, op, val]` targets the
// queried doctype directly. The 4-tuple `[child_doctype, field, op, val]`
// filters the parent doc by a value on one of its child rows — Frappe's
// canonical way to query parents by child columns without writing SQL.
export type FilterTuple3 = [string, string, unknown];
export type FilterTuple4 = [string, string, string, unknown];
export type FilterTuple = FilterTuple3 | FilterTuple4;

export interface ListParams {
  fields?: string[];
  filters?: FilterTuple[] | Record<string, unknown>;
  order_by?: string;
  limit_start?: number;
  limit_page_length?: number;
  or_filters?: FilterTuple[];
}

function hasSekolahFilter(filters: FilterTuple[] | Record<string, unknown>): boolean {
  if (Array.isArray(filters)) {
    return filters.some((f) => f[0] === "sekolah" || (f.length === 4 && f[1] === "sekolah"));
  }
  return Object.prototype.hasOwnProperty.call(filters, "sekolah");
}

function injectSekolahFilter(
  doctype: string,
  filters: FilterTuple[] | Record<string, unknown> | undefined,
): FilterTuple[] | Record<string, unknown> | undefined {
  if (!isTenantedDoctype(doctype)) return filters;
  const slug = activeSekolah();
  if (!slug) return filters;
  if (filters && hasSekolahFilter(filters)) return filters;
  if (Array.isArray(filters)) {
    return [...filters, ["sekolah", "=", slug] as FilterTuple3];
  }
  if (filters && typeof filters === "object") {
    return { ...filters, sekolah: slug };
  }
  return [["sekolah", "=", slug] as FilterTuple3];
}

// A bare order-by segment: a single column identifier with an optional asc/desc
// and nothing else (no table prefix, no dotted child path, no function call).
const BARE_ORDER_COL = /^([A-Za-z_][A-Za-z0-9_]*)(\s+(asc|desc))?$/i;

// Qualify bare order-by columns to the parent table when the field list pulls a
// dotted child-table column. Requesting a dotted field (e.g. "roles.role") makes
// Frappe LEFT JOIN the child table; a bare order_by column that exists on both
// tables (modified/creation/name/idx/owner/docstatus) is then ambiguous and the
// query 500s with MariaDB 1052. A bare column in a child-joined list can only
// legitimately mean the PARENT column, so qualifying it to `tab<Doctype>` is
// always correct. No-ops when no field is dotted, or when a segment is already
// qualified/dotted/backticked. Exported for unit tests.
export function qualifyOrderBy(doctype: string, fields: string[] | undefined, orderBy: string): string {
  const hasDottedField = (fields ?? []).some((f) => f.includes("."));
  if (!hasDottedField) return orderBy;
  return orderBy
    .split(",")
    .map((seg) => {
      const m = seg.trim().match(BARE_ORDER_COL);
      if (!m) return seg.trim(); // already qualified / dotted / backticked — leave as-is
      const dir = m[3] ? ` ${m[3]}` : "";
      return `\`tab${doctype}\`.${m[1]}${dir}`;
    })
    .join(", ");
}

export function listResource<T = Record<string, unknown>>(doctype: string, params: ListParams = {}): Promise<T[]> {
  const q: Record<string, unknown> = {};
  if (params.fields) q["fields"] = params.fields;
  const filters = injectSekolahFilter(doctype, params.filters);
  if (filters) q["filters"] = filters;
  if (params.or_filters) q["or_filters"] = params.or_filters;
  if (params.order_by) q["order_by"] = qualifyOrderBy(doctype, params.fields, params.order_by);
  if (params.limit_start !== undefined) q["limit_start"] = params.limit_start;
  if (params.limit_page_length !== undefined) q["limit_page_length"] = params.limit_page_length;
  return req<T[]>("GET", buildUrl(doctype, q));
}

export async function getResource<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  const doc = await req<T>("GET", buildUrl(`${doctype}/${encodeURIComponent(name)}`));
  if (isTenantedDoctype(doctype)) {
    const slug = activeSekolah();
    const docSekolah = (doc as { sekolah?: unknown } | null)?.sekolah;
    if (slug && typeof docSekolah === "string" && docSekolah && docSekolah !== slug) {
      throw new TenantMismatchError(doctype, name);
    }
  }
  return doc;
}

export function createResource<T = Record<string, unknown>>(doctype: string, doc: Record<string, unknown>): Promise<T> {
  return req<T>("POST", buildUrl(doctype), doc);
}

export function updateResource<T = Record<string, unknown>>(doctype: string, name: string, patch: Record<string, unknown>): Promise<T> {
  return req<T>("PUT", buildUrl(`${doctype}/${encodeURIComponent(name)}`), patch);
}

export function deleteResource(doctype: string, name: string): Promise<unknown> {
  return req<unknown>("DELETE", buildUrl(`${doctype}/${encodeURIComponent(name)}`));
}

// Partition the react-query cache by active sekolah so switching schools never
// surfaces another tenant's cached rows. The server-side filter is correct,
// but without this, a stale cache entry from school A would be returned for
// school B until the background refetch completes.
function tenantKey(doctype: string): string | null {
  return isTenantedDoctype(doctype) ? activeSekolah() : null;
}

export function useResourceList<T = Record<string, unknown>>(
  doctype: string,
  params: ListParams = {},
  options: Omit<UseQueryOptions<T[]>, "queryKey" | "queryFn"> = {},
) {
  return useQuery<T[]>({
    queryKey: ["resource:list", doctype, tenantKey(doctype), params],
    queryFn: () => listResource<T>(doctype, params),
    ...options,
  });
}

export function useResourceDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string | undefined,
  options: Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> = {},
) {
  const { enabled, ...rest } = options;
  return useQuery<T>({
    queryKey: ["resource:doc", doctype, tenantKey(doctype), name],
    queryFn: () => getResource<T>(doctype, name!),
    ...rest,
    enabled: (enabled ?? true) && !!name,
  });
}

export function useResourceCreate<T = Record<string, unknown>>(doctype: string) {
  return useMutation<T, Error, Record<string, unknown>>({
    mutationFn: (doc) => createResource<T>(doctype, doc),
  });
}

export function useResourceUpdate<T = Record<string, unknown>>(doctype: string) {
  return useMutation<T, Error, { name: string; patch: Record<string, unknown> }>({
    mutationFn: ({ name, patch }) => updateResource<T>(doctype, name, patch),
  });
}

export function useResourceDelete(doctype: string) {
  return useMutation<unknown, Error, string>({
    mutationFn: (name) => deleteResource(doctype, name),
  });
}
