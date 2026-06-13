// Tenant scoping for Frappe resource calls (ADR-0042 multi-tenant).
//
// Two tenant kinds exist client-side:
//   - "sekolah": the classic school anchor — every tenanted doctype carries a
//     `sekolah` link and lists are pinned with `sekolah = <active>`.
//   - "koperasi": the org-level koperasi anchor (routes under /kop/$sekolah).
//     KOPERASI-tier doctypes (mirror of backend tenant_registry DOCTYPES
//     ["KOPERASI"]) are pinned by their `koperasi` link; SCHOOL-tier doctypes
//     browsed from a koperasi context (e.g. Siswa pickers) are pinned to the
//     set of schools the koperasi covers (`sekolah in [...]`).
//
// Pure helpers only — no fetch, no react-query — so the scoping rules are
// unit-testable in isolation (tests/koperasiTenant.test.ts).

export interface ActiveSekolahTenant {
  kind: "sekolah";
  /** Sekolah doc-ID (NOT the URL slug). */
  sekolah: string;
}

export interface ActiveKoperasiTenant {
  kind: "koperasi";
  /** Koperasi doc-ID. */
  koperasi: string;
  /** Covered Sekolah doc-IDs, sekolah_utama first (used as anchor header). */
  schools: readonly string[];
}

export type ActiveTenant = ActiveSekolahTenant | ActiveKoperasiTenant;

// Doctypes that have NO `sekolah` link field — global/master data shared
// across all schools. Auto-scope injection is skipped for these.
export const TENANT_BLOCKLIST = new Set<string>([
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
  // koperasi global masters — no sekolah/koperasi link on these.
  "Koperasi",
  "Pengaturan Koperasi",
  "Denominasi Uang",
  "Fatwa DSN MUI",
  "Sanctions List Entry",
  // koperasi child tables (istable=1) — tenanted via their parent; they have
  // no own sekolah/koperasi column, and lists require the `parent` param.
  "Jadwal Angsuran",
  "Simpanan Pokok Wajib",
  "Item Denominasi Kas",
  "Item SHU Anggota",
  "Terminal",
  "Koperasi Sekolah",
  "Akad Aktif Koperasi",
]);

// KOPERASI-tier doctypes — MUST mirror backend
// sekolahpro/api/tenant_registry.py DOCTYPES["KOPERASI"] (minus self-anchored
// "Koperasi" which is blocklisted above). Rows carry `koperasi` + `sekolah`.
const KOPERASI_SCOPED_DOCTYPES = new Set<string>([
  "Nasabah",
  "Anggota Koperasi",
  "Pengguna Koperasi",
  "Akad",
  "Akad Pembiayaan",
  "Produk Pembiayaan",
  "Produk Simpanan",
  "Rekening Simpanan",
  "Transaksi Simpanan",
  "Pembayaran Angsuran",
  "Sesi Kas Teller",
  "Pembagian SHU",
  "Kartu",
  "Transaksi Kartu",
  "Top Up",
  "E-Money Wallet",
  "Merchant",
  "Periode Tutup Koperasi",
  "Laporan PPATK",
  "Permohonan Buka Rekening",
  "Permohonan Tutup Rekening",
  "Permohonan Blokir Rekening",
  "Permohonan Unblokir Rekening",
  "Permohonan Aktivasi Dormant",
  "Aset Wakaf",
  "Jenis Dana ZIS",
  "Penerimaan ZIS",
  "Penyaluran ZIS",
  "Program Penyaluran",
]);

export function isTenantedDoctype(doctype: string): boolean {
  return !TENANT_BLOCKLIST.has(doctype);
}

export function isKoperasiScopedDoctype(doctype: string): boolean {
  return isTenantedDoctype(doctype) && KOPERASI_SCOPED_DOCTYPES.has(doctype);
}

export type FilterTuple3 = [string, string, unknown];
export type FilterTuple4 = [string, string, string, unknown];
export type FilterTuple = FilterTuple3 | FilterTuple4;
export type Filters = FilterTuple[] | Record<string, unknown>;

/** True when the caller already filters on `field` (array or object form). */
function hasFieldFilter(filters: Filters, field: string): boolean {
  if (Array.isArray(filters)) {
    return filters.some((f) => f[0] === field || (f.length === 4 && f[1] === field));
  }
  return Object.prototype.hasOwnProperty.call(filters, field);
}

/** Append a tuple filter, preserving the caller's array/object shape. */
function appendFilter(filters: Filters | undefined, tuple: FilterTuple3): Filters {
  if (Array.isArray(filters)) return [...filters, tuple];
  if (filters && typeof filters === "object") return { ...filters, [tuple[0]]: tuple[2] };
  return [tuple];
}

/** The (field, op, value) pin for a doctype under the given tenant, or null. */
function tenantPin(doctype: string, tenant: ActiveTenant): FilterTuple3 | null {
  if (tenant.kind === "sekolah") return ["sekolah", "=", tenant.sekolah];
  if (isKoperasiScopedDoctype(doctype)) return ["koperasi", "=", tenant.koperasi];
  return ["sekolah", "in", [...tenant.schools]];
}

/**
 * Inject the tenant pin into list filters. No-op for untenanted doctypes,
 * missing tenant, or when the caller already filters on the pin field.
 * NOTE: the object-filter shape cannot express `in`; koperasi-context
 * SCHOOL-tier pins therefore always use the array shape (appendFilter keeps
 * object shape only for `=` pins, which is the sekolah/koperasi case).
 */
export function injectTenantFilter(
  doctype: string,
  tenant: ActiveTenant | null | undefined,
  filters: Filters | undefined,
): Filters | undefined {
  if (!isTenantedDoctype(doctype) || !tenant) return filters;
  const pin = tenantPin(doctype, tenant);
  if (!pin) return filters;
  if (filters && hasFieldFilter(filters, pin[0])) return filters;
  if (pin[1] !== "=" && filters && !Array.isArray(filters)) {
    // `in` pin cannot ride on an object filter — convert to tuple array.
    const tuples = Object.entries(filters).map(
      ([k, v]) => [k, "=", v] as FilterTuple3,
    );
    return [...tuples, pin];
  }
  return appendFilter(filters, pin);
}

/**
 * Cross-tenant guard for a fetched doc. Returns true when the doc does NOT
 * belong to the active tenant (caller throws TenantMismatchError).
 * Docs without the pin field set (legacy rows pre-backfill) fall back to the
 * `sekolah` check for koperasi tenants, and pass when neither field is set.
 */
export function isTenantMismatch(
  doctype: string,
  tenant: ActiveTenant | null | undefined,
  doc: { sekolah?: unknown; koperasi?: unknown } | null | undefined,
): boolean {
  if (!isTenantedDoctype(doctype) || !tenant || !doc) return false;
  const docSekolah = typeof doc.sekolah === "string" ? doc.sekolah : "";
  if (tenant.kind === "sekolah") {
    return Boolean(docSekolah) && docSekolah !== tenant.sekolah;
  }
  if (isKoperasiScopedDoctype(doctype)) {
    const docKoperasi = typeof doc.koperasi === "string" ? doc.koperasi : "";
    if (docKoperasi) return docKoperasi !== tenant.koperasi;
    // Legacy row without koperasi — accept when its sekolah is covered.
    return Boolean(docSekolah) && !tenant.schools.includes(docSekolah);
  }
  return Boolean(docSekolah) && !tenant.schools.includes(docSekolah);
}

/** react-query cache partition key for the active tenant (null = global). */
export function tenantCacheKey(
  doctype: string,
  tenant: ActiveTenant | null | undefined,
): string | null {
  if (!isTenantedDoctype(doctype) || !tenant) return null;
  return tenant.kind === "koperasi" ? tenant.koperasi : tenant.sekolah;
}
