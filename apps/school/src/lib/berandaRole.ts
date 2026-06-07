/**
 * Role helper for the role-adaptive Beranda dashboard ("Antrean Saya").
 *
 * Derives a coarse presentation persona (kepala_sekolah / tu_operator / guru /
 * wali_kelas / bendahara) from the Frappe auth session so the dashboard can
 * REORDER and SCOPE its panels per audience — never to HIDE functionality
 * (emphasis-not-visibility contract, same as lib/keuanganRole.ts).
 *
 * Composes the generic engine in lib/sessionRole.ts (normalizeRole / mapRoles /
 * pickPrimary) instead of re-implementing role parsing. The only thing layered
 * on top is a full-access short-circuit (admin roles see every persona).
 *
 * NOTE: `wali_kelas` is BOTH a Frappe role ("Wali Kelas") AND a data fact
 * (Rombongan Belajar.wali_kelas == user). This pure module only maps the role
 * string; the data-driven part (a user who is wali of >=1 rombel but lacks the
 * Frappe role) is layered in the hook useBerandaRole() in lib/beranda/scope.ts.
 */
import {
  mapRoles,
  normalizeRole,
  pickPrimary,
  type DeriveRoleConfig,
  type DerivedRoles,
  type RoleMatcher,
} from "./sessionRole";

/** Coarse persona buckets understood by the Beranda redesign. */
export type BerandaRole = "kepala_sekolah" | "tu_operator" | "guru" | "wali_kelas" | "bendahara";

/** Every persona, used by the permissive fallback and full-access roles. */
export const ALL_BERANDA_ROLES: readonly BerandaRole[] = [
  "kepala_sekolah",
  "tu_operator",
  "guru",
  "wali_kelas",
  "bendahara",
];

/** Human-readable Bahasa Indonesia label for each persona (used by role chips). */
export const BERANDA_ROLE_LABEL: Record<BerandaRole, string> = {
  kepala_sekolah: "Kepala Sekolah",
  tu_operator: "TU / Operator",
  guru: "Guru",
  wali_kelas: "Wali Kelas",
  bendahara: "Bendahara",
};

/**
 * Priority when collapsing a multi-persona session to a single primary view.
 * Oversight (kepala) first; among teaching, wali_kelas (one rombel, more
 * specific) beats guru; tu_operator is the most generic worklist, picked last.
 */
const PRIMARY_PRIORITY: readonly BerandaRole[] = [
  "kepala_sekolah",
  "bendahara",
  "wali_kelas",
  "guru",
  "tu_operator",
];

/** Default persona for the permissive fallback: the generic operational worklist. */
const DEFAULT_PRIMARY: BerandaRole = "tu_operator";

/**
 * Frappe roles that imply full access to every persona view. When any is
 * present the user is granted all personas (admin sees the whole dashboard).
 */
const FULL_ACCESS_NEEDLES: readonly string[] = [
  "super_admin",
  "admin_sekolah",
  "administrator",
  "system_manager",
];

/**
 * Frappe role substrings → Beranda persona. Order matters: more specific needles
 * first so "Wali Kelas" maps to wali_kelas before the broader "guru" needle, and
 * "kepala" oversight is detected before anything else.
 */
const MATCHERS: ReadonlyArray<RoleMatcher<BerandaRole>> = [
  { needle: "kepala_sekolah", role: "kepala_sekolah" },
  { needle: "kepala", role: "kepala_sekolah" },
  { needle: "principal", role: "kepala_sekolah" },
  { needle: "bendahara", role: "bendahara" },
  { needle: "treasurer", role: "bendahara" },
  { needle: "wali_kelas", role: "wali_kelas" },
  { needle: "homeroom", role: "wali_kelas" },
  { needle: "guru", role: "guru" },
  { needle: "teacher", role: "guru" },
  { needle: "pengajar", role: "guru" },
  { needle: "tata_usaha", role: "tu_operator" },
  { needle: "operator", role: "tu_operator" },
];

/** Shared config for the generic {@link deriveRoles} engine. */
export const BERANDA_ROLE_CONFIG: DeriveRoleConfig<BerandaRole> = {
  matchers: MATCHERS,
  allRoles: ALL_BERANDA_ROLES,
  priority: PRIMARY_PRIORITY,
  defaultPrimary: DEFAULT_PRIMARY,
};

/**
 * Map raw Frappe role strings to the set of personas they imply. A full-access
 * role short-circuits to every persona. Returns an empty array when none match.
 */
export function mapBerandaRoles(rawRoles: readonly string[]): BerandaRole[] {
  const normalized = rawRoles.map(normalizeRole);
  if (normalized.some((r) => FULL_ACCESS_NEEDLES.some((n) => r.includes(n)))) {
    return [...ALL_BERANDA_ROLES];
  }
  return mapRoles(rawRoles, MATCHERS);
}

/**
 * Derive personas + primary from raw session roles. Empty input or no matcher
 * hit yields the permissive fallback (every persona, primary tu_operator) so the
 * dashboard is never gated by accident.
 */
export function deriveBerandaRoles(rawRoles: readonly string[]): DerivedRoles<BerandaRole> {
  const roles = mapBerandaRoles(rawRoles);
  if (rawRoles.length === 0 || roles.length === 0) {
    return { roles: [...ALL_BERANDA_ROLES], primary: DEFAULT_PRIMARY };
  }
  return { roles, primary: pickPrimary(roles, PRIMARY_PRIORITY, DEFAULT_PRIMARY) };
}
