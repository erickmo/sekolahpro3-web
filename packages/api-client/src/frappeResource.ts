import { useMutation, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  injectTenantFilter,
  isTenantMismatch,
  isTenantedDoctype,
  tenantCacheKey,
  TENANT_BLOCKLIST,
  type ActiveTenant,
  type FilterTuple,
  type FilterTuple3,
  type FilterTuple4,
} from "./tenant";

export {
  isTenantedDoctype,
  TENANT_BLOCKLIST,
  type ActiveTenant,
  type FilterTuple,
  type FilterTuple3,
  type FilterTuple4,
};

type Config = {
  baseUrl: string;
  csrfToken?: string;
  getActiveSekolah?: () => string | null | undefined;
  /**
   * Full tenant descriptor (sekolah OR koperasi context). When provided it
   * wins over getActiveSekolah; the latter stays as back-compat for apps that
   * only ever anchor to a school.
   */
  getActiveTenant?: () => ActiveTenant | null | undefined;
};

let cfg: Config = { baseUrl: "" };

// Request header carrying the active Sekolah's doc-ID. The backend
// (`sekolahpro.api.tenant_scope.auto_set_tenant`) reads this header on every
// write to populate `sekolah`/`organisasi`, and validates it against the
// user's memberships. Sent on ALL requests so server-side scoping never has
// to fall back to guessing the tenant from the session.
export const ACTIVE_SEKOLAH_HEADER = "X-Active-Sekolah";

// Companion header for koperasi-context writes: the backend KOPERASI tier
// resolves `koperasi` (and derives `sekolah`) from this value.
export const ACTIVE_KOPERASI_HEADER = "X-Active-Koperasi";

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

// (moved to ./tenant.ts — kept here only as a reference of the old shape)
/**
 * Resolve the active tenant: prefer the full descriptor, fall back to the
 * legacy sekolah-only getter so existing apps keep working unchanged.
 */
function activeTenant(): ActiveTenant | null {
  const t = cfg.getActiveTenant?.();
  if (t) return t;
  const s = cfg.getActiveSekolah?.();
  return s ? { kind: "sekolah", sekolah: s } : null;
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const tenant = activeTenant();
  // Anchor school: the koperasi's primary school rides along so SCHOOL-tier
  // writes issued from a koperasi context stay sanely anchored server-side.
  const sekolah =
    tenant?.kind === "koperasi" ? (tenant.schools[0] ?? "") : (tenant?.sekolah ?? "");
  const koperasi = tenant?.kind === "koperasi" ? tenant.koperasi : "";
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Frappe-CSRF-Token": cfg.csrfToken ?? "",
    [ACTIVE_SEKOLAH_HEADER]: sekolah,
    [ACTIVE_KOPERASI_HEADER]: koperasi,
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

export interface ListParams {
  fields?: string[];
  filters?: FilterTuple[] | Record<string, unknown>;
  order_by?: string;
  limit_start?: number;
  limit_page_length?: number;
  or_filters?: FilterTuple[];
  /**
   * Parent doctype — REQUIRED when listing a child table (istable) doctype.
   * Maps to Frappe's `parent` query param (frappe.client.get_list), which
   * both permits the read (check_parent_permission) and scopes the join.
   */
  parent?: string;
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
  const filters = injectTenantFilter(doctype, activeTenant(), params.filters);
  if (filters) q["filters"] = filters;
  if (params.or_filters) q["or_filters"] = params.or_filters;
  if (params.order_by) q["order_by"] = qualifyOrderBy(doctype, params.fields, params.order_by);
  if (params.limit_start !== undefined) q["limit_start"] = params.limit_start;
  if (params.limit_page_length !== undefined) q["limit_page_length"] = params.limit_page_length;
  if (params.parent) q["parent"] = params.parent;
  return req<T[]>("GET", buildUrl(doctype, q));
}

export async function getResource<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  const doc = await req<T>("GET", buildUrl(`${doctype}/${encodeURIComponent(name)}`));
  if (isTenantMismatch(doctype, activeTenant(), doc as { sekolah?: unknown; koperasi?: unknown } | null)) {
    throw new TenantMismatchError(doctype, name);
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

// Partition the react-query cache by active tenant (sekolah OR koperasi) so
// switching tenants never surfaces another tenant's cached rows. The
// server-side filter is correct, but without this a stale cache entry from
// tenant A would be returned for tenant B until the background refetch lands.
function tenantKey(doctype: string): string | null {
  return tenantCacheKey(doctype, activeTenant());
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
