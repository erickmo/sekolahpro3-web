/**
 * Library (Perpustakaan) role helper.
 *
 * Derives a coarse library role (petugas / pustakawan / admin) from the Frappe
 * auth session so the redesign can FRAME the UI for the daily circulation desk
 * audience (labels, guidance, emphasis) without ever HIDING functionality.
 *
 * Built on the generic {@link deriveRoles} engine. Permissive-by-design: when no
 * role matches, every bucket is granted and the primary defaults to `petugas`
 * (the circulation-staff point of view this module is designed around). Roles
 * are a presentation hint only — access control stays on the backend.
 */
import { useSession } from "@sekolahpro/auth";
import {
  deriveRoles,
  type DeriveRoleConfig,
  type RoleMatcher,
} from "./sessionRole";

/** Coarse library role buckets understood by the redesign. */
export type PerpustakaanRole = "petugas" | "pustakawan" | "admin";

/** Human-readable Bahasa Indonesia label for each library role. */
export const ROLE_LABEL: Record<PerpustakaanRole, string> = {
  petugas: "Petugas Sirkulasi",
  pustakawan: "Kepala Perpustakaan",
  admin: "Administrator",
};

/**
 * Frappe role substrings mapped to library buckets, most-specific first.
 * Matching runs on a normalized (lowercased, spaces/dashes -> underscore) role.
 */
const ROLE_MATCHERS: ReadonlyArray<RoleMatcher<PerpustakaanRole>> = [
  { needle: "petugas_perpustakaan", role: "petugas" },
  { needle: "kepala_perpustakaan", role: "pustakawan" },
  { needle: "sirkulasi", role: "petugas" },
  { needle: "petugas", role: "petugas" },
  { needle: "operator", role: "petugas" },
  { needle: "pustakawan", role: "pustakawan" },
  { needle: "librarian", role: "pustakawan" },
  { needle: "kepala", role: "pustakawan" },
  { needle: "perpustakaan", role: "petugas" },
  { needle: "admin_sekolah", role: "admin" },
  { needle: "super_admin", role: "admin" },
  { needle: "admin", role: "admin" },
];

/**
 * Shared derivation config. `petugas` is the default primary because the module
 * is designed from the circulation-staff point of view; `pustakawan` (oversight)
 * outranks `admin` (setup) outranks `petugas` (daily) when picking a primary.
 */
export const PERPUS_ROLE_CONFIG: DeriveRoleConfig<PerpustakaanRole> = {
  matchers: ROLE_MATCHERS,
  allRoles: ["petugas", "pustakawan", "admin"],
  priority: ["pustakawan", "admin", "petugas"],
  defaultPrimary: "petugas",
};

/** Shape returned by {@link usePerpustakaanRole}. */
export interface PerpustakaanRoleInfo {
  roles: PerpustakaanRole[];
  primary: PerpustakaanRole;
  isPetugas: boolean;
  isPustakawan: boolean;
  isAdmin: boolean;
}

/**
 * Read the current library role info from the auth session.
 *
 * `useSession` throws when no <SessionProvider> is mounted; that (and an empty
 * role set, or no matcher hit) yields the permissive fallback rather than
 * crashing or gating the page.
 */
export function usePerpustakaanRole(): PerpustakaanRoleInfo {
  let rawRoles: string[] = [];
  try {
    const session = useSession();
    rawRoles = session.roles ?? [];
  } catch {
    // No provider mounted — fall through to permissive derivation below.
  }

  const { roles, primary } = deriveRoles(rawRoles, PERPUS_ROLE_CONFIG);
  return {
    roles,
    primary,
    isPetugas: roles.includes("petugas"),
    isPustakawan: roles.includes("pustakawan"),
    isAdmin: roles.includes("admin"),
  };
}
