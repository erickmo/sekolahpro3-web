/**
 * Finance/accounting role helper for the unified Keuangan hub.
 *
 * Derives a coarse presentation role (bendahara / kasir / akuntan / kepala) from
 * the Frappe auth session so the redesign can FRAME the UI per audience (labels,
 * guidance, emphasis) without ever HIDING functionality.
 *
 * Permissive-by-design: when no role can be matched, or the session is loading /
 * unauthenticated / has no roles, every role is granted. Roles here are a
 * presentation hint, never an access gate — access control stays on the backend
 * (Frappe permissions on the vernon_accounting doctypes).
 *
 * Mirrors lib/akademikRole.ts (the akademik redesign reference pattern).
 */
import { useSession } from "@sekolahpro/auth";

/** Coarse finance role buckets understood by the Keuangan hub redesign. */
export type KeuanganRole = "bendahara" | "kasir" | "akuntan" | "kepala";

/** Every role, used by the permissive fallback and full-access roles. */
export const ALL_KEUANGAN_ROLES: readonly KeuanganRole[] = [
  "bendahara",
  "kasir",
  "akuntan",
  "kepala",
];

/** Human-readable Bahasa Indonesia label for each finance role. */
export const ROLE_LABEL: Record<KeuanganRole, string> = {
  bendahara: "Bendahara",
  kasir: "Kasir / Tata Usaha",
  akuntan: "Akuntan",
  kepala: "Kepala Sekolah",
};

/** Shape returned by {@link useKeuanganRole}. */
export interface KeuanganRoleInfo {
  roles: KeuanganRole[];
  primary: KeuanganRole;
  isBendahara: boolean;
  isKasir: boolean;
  isAkuntan: boolean;
  isKepala: boolean;
}

/**
 * Priority order when picking the single `primary` role from a set.
 * Kepala (oversight) > bendahara (finance lead) > akuntan (ledger) > kasir (front desk).
 */
const PRIMARY_PRIORITY: readonly KeuanganRole[] = ["kepala", "bendahara", "akuntan", "kasir"];

/** Default primary role when no finance role can be inferred. */
const DEFAULT_PRIMARY: KeuanganRole = "bendahara";

/**
 * Frappe roles that imply full access to the whole finance hub. When any of
 * these is present the user is granted every presentation role.
 */
const FULL_ACCESS_NEEDLES: readonly string[] = [
  "super_admin",
  "admin_sekolah",
  "administrator",
  "system_manager",
];

/**
 * Frappe role substrings mapped to finance buckets. Matching is done on a
 * normalized (lowercased, spaces/dashes -> underscore) role string so variants
 * like "Kepala Sekolah", "kepala-sekolah" and "kepala_sekolah" all match.
 * "accounts" covers Frappe's "Accounts Manager" / "Accounts User".
 */
const ROLE_MATCHERS: ReadonlyArray<{ needle: string; role: KeuanganRole }> = [
  { needle: "kepala_sekolah", role: "kepala" },
  { needle: "kepala", role: "kepala" },
  { needle: "principal", role: "kepala" },
  { needle: "bendahara", role: "bendahara" },
  { needle: "treasurer", role: "bendahara" },
  { needle: "akuntan", role: "akuntan" },
  { needle: "akunting", role: "akuntan" },
  { needle: "accounts", role: "akuntan" },
  { needle: "accountant", role: "akuntan" },
  { needle: "kasir", role: "kasir" },
  { needle: "cashier", role: "kasir" },
  { needle: "teller", role: "kasir" },
  { needle: "tata_usaha", role: "kasir" },
  { needle: "operator", role: "kasir" },
];

/**
 * Normalize a raw Frappe role string for tolerant comparison.
 * Lowercases and collapses spaces and dashes into underscores.
 */
function normalizeRole(raw: string): string {
  return raw.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

/**
 * Map a list of raw Frappe role strings to the set of finance buckets they
 * imply. A full-access role short-circuits to every role. Returns an empty
 * array when none match.
 */
export function mapFrappeRolesToKeuangan(rawRoles: readonly string[]): KeuanganRole[] {
  const normalized = rawRoles.map(normalizeRole);

  // Full-access roles (super admin, school admin) see the whole hub.
  if (normalized.some((r) => FULL_ACCESS_NEEDLES.some((n) => r.includes(n)))) {
    return [...ALL_KEUANGAN_ROLES];
  }

  const found = new Set<KeuanganRole>();
  for (const r of normalized) {
    for (const { needle, role } of ROLE_MATCHERS) {
      if (r.includes(needle)) {
        found.add(role);
        break;
      }
    }
  }
  return [...found];
}

/**
 * Pick the single primary role from a set using {@link PRIMARY_PRIORITY}.
 * Falls back to {@link DEFAULT_PRIMARY} when the set is empty.
 */
export function pickPrimaryRole(roles: readonly KeuanganRole[]): KeuanganRole {
  for (const candidate of PRIMARY_PRIORITY) {
    if (roles.includes(candidate)) {
      return candidate;
    }
  }
  return DEFAULT_PRIMARY;
}

/** Build the permissive fallback result that grants every finance role. */
function permissiveFallback(): KeuanganRoleInfo {
  return {
    roles: [...ALL_KEUANGAN_ROLES],
    primary: DEFAULT_PRIMARY,
    isBendahara: true,
    isKasir: true,
    isAkuntan: true,
    isKepala: true,
  };
}

/**
 * Read the current finance role info from the auth session.
 *
 * Resolution mirrors {@link useAkademikRole}: missing provider, empty roles, or
 * no match all yield the permissive fallback so the UI is never gated.
 */
export function useKeuanganRole(): KeuanganRoleInfo {
  // `useSession` throws when no <SessionProvider> is mounted; treat that as the
  // permissive fallback rather than crashing the page.
  let rawRoles: string[] = [];
  try {
    const session = useSession();
    rawRoles = session.roles ?? [];
  } catch {
    return permissiveFallback();
  }

  if (rawRoles.length === 0) {
    return permissiveFallback();
  }

  const roles = mapFrappeRolesToKeuangan(rawRoles);
  if (roles.length === 0) {
    return permissiveFallback();
  }

  return {
    roles,
    primary: pickPrimaryRole(roles),
    isBendahara: roles.includes("bendahara"),
    isKasir: roles.includes("kasir"),
    isAkuntan: roles.includes("akuntan"),
    isKepala: roles.includes("kepala"),
  };
}
