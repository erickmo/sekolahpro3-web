/**
 * People-domain (Orang) role helper — shared by the Siswa (kesiswaan) and
 * Guru & Staff (kepegawaian) modules.
 *
 * Derives a coarse role (tata_usaha / pimpinan / admin) from the Frappe auth
 * session so both modules can FRAME their UI per audience (labels, guidance,
 * emphasis) WITHOUT ever HIDING functionality. Both modules are owned day-to-day
 * by Tata Usaha, so that is the default point of view.
 *
 * Built on the generic {@link deriveRoles} engine (mirrors perpustakaanRole.ts).
 * Permissive-by-design: when no role matches (no provider / empty / unmatched
 * roles), every bucket is granted and the primary defaults to `tata_usaha`.
 * Roles are a presentation hint only — access control stays on the backend.
 */
import { useSession } from "@sekolahpro/auth";
import { deriveRoles, type DeriveRoleConfig, type RoleMatcher } from "./sessionRole";

/** Coarse people-domain role buckets understood by the redesign. */
export type OrangRole = "tata_usaha" | "pimpinan" | "admin";

/** Human-readable Bahasa Indonesia label for each people-domain role. */
export const ROLE_LABEL: Record<OrangRole, string> = {
  tata_usaha: "Tata Usaha",
  pimpinan: "Pimpinan Sekolah",
  admin: "Administrator",
};

/**
 * Frappe role substrings mapped to people-domain buckets, most-specific first.
 * Matching runs on a normalized (lowercased, spaces/dashes -> underscore) role.
 * Only specific needles are used — no bare 2-char needle (e.g. "tu") that could
 * false-match unrelated roles, since matching is substring-based, not word-bound.
 */
const ROLE_MATCHERS: ReadonlyArray<RoleMatcher<OrangRole>> = [
  { needle: "kepala_sekolah", role: "pimpinan" },
  { needle: "wakil_kepala", role: "pimpinan" },
  { needle: "pimpinan", role: "pimpinan" },
  { needle: "kepala", role: "pimpinan" },
  { needle: "tata_usaha", role: "tata_usaha" },
  { needle: "kesiswaan", role: "tata_usaha" },
  { needle: "kepegawaian", role: "tata_usaha" },
  { needle: "operator", role: "tata_usaha" },
  { needle: "admin_sekolah", role: "admin" },
  { needle: "super_admin", role: "admin" },
  { needle: "admin", role: "admin" },
];

/**
 * Shared derivation config. `tata_usaha` is the default primary because both the
 * Siswa and Staff modules are run day-to-day by Tata Usaha; `pimpinan`
 * (oversight) outranks `admin` (setup) outranks `tata_usaha` (daily) when
 * picking a single primary from a multi-role set.
 */
export const ORANG_ROLE_CONFIG: DeriveRoleConfig<OrangRole> = {
  matchers: ROLE_MATCHERS,
  allRoles: ["tata_usaha", "pimpinan", "admin"],
  priority: ["pimpinan", "admin", "tata_usaha"],
  defaultPrimary: "tata_usaha",
};

/** Shape returned by {@link useOrangRole}. */
export interface OrangRoleInfo {
  roles: OrangRole[];
  primary: OrangRole;
  isTataUsaha: boolean;
  isPimpinan: boolean;
  isAdmin: boolean;
}

/**
 * Read the current people-domain role info from the auth session.
 *
 * `useSession` throws when no <SessionProvider> is mounted; that (and an empty
 * role set, or no matcher hit) yields the permissive fallback rather than
 * crashing or gating the page.
 */
export function useOrangRole(): OrangRoleInfo {
  let rawRoles: string[] = [];
  try {
    const session = useSession();
    rawRoles = session.roles ?? [];
  } catch {
    // No provider mounted — fall through to permissive derivation below.
  }

  const { roles, primary } = deriveRoles(rawRoles, ORANG_ROLE_CONFIG);
  return {
    roles,
    primary,
    isTataUsaha: roles.includes("tata_usaha"),
    isPimpinan: roles.includes("pimpinan"),
    isAdmin: roles.includes("admin"),
  };
}
