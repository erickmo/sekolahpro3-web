// Tenant view helpers. A "tenant" is a `Organisasi` doc (ADR-0042/0043); there
// is NO `Tenant` doctype. Plan/billing live on the separate `Langganan` doctype,
// linked back via `Langganan.organisasi`. These helpers are pure (no React/DOM)
// so they can be unit-tested without testing-library.

// Mirrors the Badge `tone` union in @sekolahpro/ui (not exported there).
export type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

export interface OrganisasiRow {
  name: string;
  nama?: string;
  jenis_organisasi?: string;
  status?: string;
  subdomain?: string;
  custom_domain?: string;
  domain_verified?: 0 | 1;
  owner_email?: string;
  owner_nama?: string;
  creation?: string;
  modified?: string;
}

export interface LanggananRow {
  name: string;
  paket?: string;
  periode?: string;
  status?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  nominal?: number;
}

const EMPTY = "—";

// Organisasi.status options: Aktif | Nonaktif.
export function orgStatusTone(status: string | undefined): Tone {
  return status === "Aktif" ? "success" : "neutral";
}

// Langganan.status options: Aktif | Kadaluarsa | Dibatalkan.
export function langgananStatusTone(status: string | undefined): Tone {
  if (status === "Aktif") return "success";
  if (status === "Kadaluarsa") return "danger";
  return "neutral";
}

// Custom domain wins over the platform subdomain; em-dash when neither is set.
export function resolveTenantDomain(org: Pick<OrganisasiRow, "custom_domain" | "subdomain">): string {
  return org.custom_domain || org.subdomain || EMPTY;
}

// The "current" subscription: an active row wins over a newer cancelled/expired
// one; otherwise fall back to the newest. Caller passes rows already ordered by
// `tanggal_mulai desc`, so the first match in each pass is the newest.
export function latestLangganan(rows: LanggananRow[] | undefined): LanggananRow | null {
  if (!rows || rows.length === 0) return null;
  return rows.find((r) => r.status === "Aktif") ?? rows[0] ?? null;
}
