/**
 * Asset-management (Manajemen Aset) role helper.
 *
 * Derives a coarse asset role (petugas / manajer / admin) from the Frappe auth
 * session so the module can FRAME the UI for its primary audience — the asset
 * desk staff who handle daily borrow/return and maintenance intake — without
 * ever HIDING functionality. Built on the generic {@link deriveRoles} engine.
 *
 * Permissive-by-design: when no role matches, every bucket is granted and the
 * primary defaults to `petugas`. Roles are a presentation hint only; real
 * access control stays on the backend.
 */
import { useSession } from "@sekolahpro/auth";
import {
  deriveRoles,
  type DeriveRoleConfig,
  type RoleMatcher,
} from "../sessionRole";

/** Coarse asset role buckets understood by the module. */
export type AsetRole = "petugas" | "manajer" | "admin";

/** Human-readable Bahasa Indonesia label for each asset role. */
export const ROLE_LABEL: Record<AsetRole, string> = {
  petugas: "Petugas Aset",
  manajer: "Manajer Aset",
  admin: "Administrator",
};

/** Short audience framing shown in the context bar per primary role. */
export const ROLE_FRAMING: Record<AsetRole, string> = {
  petugas: "Kelola peminjaman, pengembalian, dan laporan kerusakan aset harian.",
  manajer: "Pantau inventaris, setujui peminjaman, dan kontrol maintenance & mutasi.",
  admin: "Atur kategori, lokasi, dan kebijakan modul aset.",
};

/**
 * Frappe role substrings mapped to asset buckets, most-specific first.
 * Matching runs on a normalized (lowercased, spaces/dashes -> underscore) role.
 */
const ROLE_MATCHERS: ReadonlyArray<RoleMatcher<AsetRole>> = [
  { needle: "petugas_aset", role: "petugas" },
  { needle: "manajer_aset", role: "manajer" },
  { needle: "manajemen_aset", role: "petugas" },
  { needle: "sarpras", role: "petugas" },
  { needle: "petugas", role: "petugas" },
  { needle: "operator", role: "petugas" },
  { needle: "manajer", role: "manajer" },
  { needle: "kepala", role: "manajer" },
  { needle: "aset", role: "petugas" },
  { needle: "admin_sekolah", role: "admin" },
  { needle: "super_admin", role: "admin" },
  { needle: "admin", role: "admin" },
];

/**
 * Shared derivation config. `petugas` is the default primary because the module
 * is designed from the asset-desk point of view; `manajer` (oversight) outranks
 * `admin` (setup) outranks `petugas` (daily) when picking a primary.
 */
export const ASET_ROLE_CONFIG: DeriveRoleConfig<AsetRole> = {
  matchers: ROLE_MATCHERS,
  allRoles: ["petugas", "manajer", "admin"],
  priority: ["manajer", "admin", "petugas"],
  defaultPrimary: "petugas",
};

/** React hook: derive the current session's asset roles + primary bucket. */
export function useAsetRole() {
  const session = useSession();
  const raw = session.roles ?? [];
  const { roles, primary } = deriveRoles(raw, ASET_ROLE_CONFIG);
  return {
    roles,
    primary,
    label: ROLE_LABEL[primary],
    framing: ROLE_FRAMING[primary],
    /** Manajer/admin may approve loans & control maintenance. */
    canApprove: roles.includes("manajer") || roles.includes("admin"),
    /** Admin may edit module settings. */
    canManageSettings: roles.includes("admin"),
  };
}
