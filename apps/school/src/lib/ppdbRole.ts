/**
 * PPDB role helper.
 *
 * Derives a coarse PPDB role (staff / manajer) from the Frappe auth session so
 * the redesign can FRAME the UI per audience (labels, guidance, emphasis)
 * without ever HIDING functionality.
 *
 * Permissive-by-design: when no PPDB role can be matched, or the session is
 * still loading / unauthenticated / has no roles, every role is granted. Roles
 * here are a presentation hint, never an access gate — access control stays on
 * the backend.
 */
import { useSession } from "@sekolahpro/auth";

/** Coarse PPDB role buckets understood by the redesign. */
export type PpdbRole = "staff" | "manajer";

/** Human-readable Bahasa Indonesia label for each PPDB role. */
export const ROLE_LABEL: Record<PpdbRole, string> = {
  staff: "Staff PPDB",
  manajer: "Manajer PPDB",
};

/** Shape returned by {@link usePpdbRole}. */
export interface PpdbRoleInfo {
  roles: PpdbRole[];
  primary: PpdbRole;
  isStaff: boolean;
  isManajer: boolean;
}

/**
 * Priority order when picking the single `primary` role from a set.
 * Manajer (oversight) wins over staff (day-to-day operations).
 */
const PRIMARY_PRIORITY: readonly PpdbRole[] = ["manajer", "staff"];

/** Permissive fallback granting every role (used when nothing matches). */
const ALL_ROLES: readonly PpdbRole[] = ["staff", "manajer"];

/** Default primary role when no PPDB role can be inferred. */
const DEFAULT_PRIMARY: PpdbRole = "staff";

/**
 * Frappe role substrings mapped to PPDB buckets. Matching is done on a
 * normalized (lowercased, spaces/dashes -> underscore) role string so variants
 * like "Kepala Sekolah", "kepala-sekolah" and "kepala_sekolah" all match.
 */
const ROLE_MATCHERS: ReadonlyArray<{ needle: string; role: PpdbRole }> = [
  { needle: "kepala_sekolah", role: "manajer" },
  { needle: "kepala", role: "manajer" },
  { needle: "operator", role: "staff" },
  { needle: "bendahara", role: "staff" },
  { needle: "admin_sekolah", role: "staff" },
  { needle: "super_admin", role: "staff" },
  { needle: "admin", role: "staff" },
];

/**
 * Normalize a raw Frappe role string for tolerant comparison.
 * Lowercases and collapses spaces and dashes into underscores.
 */
export function normalizeRole(raw: string): string {
  return raw.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

/**
 * Map a list of raw Frappe role strings to the set of PPDB buckets they imply.
 * Returns an empty array when none match.
 */
export function mapPpdbRoles(rawRoles: readonly string[]): PpdbRole[] {
  const found = new Set<PpdbRole>();
  for (const raw of rawRoles) {
    const normalized = normalizeRole(raw);
    for (const { needle, role } of ROLE_MATCHERS) {
      // First matcher wins per role string; longer needles (e.g. admin_sekolah)
      // are listed before shorter ones (admin) so the specific match takes it.
      if (normalized.includes(needle)) {
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
export function pickPrimary(roles: readonly PpdbRole[]): PpdbRole {
  for (const candidate of PRIMARY_PRIORITY) {
    if (roles.includes(candidate)) {
      return candidate;
    }
  }
  return DEFAULT_PRIMARY;
}

/**
 * Build the permissive fallback result that grants every PPDB role.
 * Used when the session is unavailable, has no roles, or no role matched.
 */
function permissiveFallback(): PpdbRoleInfo {
  return {
    roles: [...ALL_ROLES],
    // Default to the higher-privilege view so the UI never under-exposes
    // guidance; access control remains enforced on the backend.
    primary: "manajer",
    isStaff: true,
    isManajer: true,
  };
}

/**
 * Read the current PPDB role info from the auth session.
 *
 * Resolution:
 *  - If `useSession` is unavailable (no provider) or the session has no roles,
 *    return the permissive fallback (all roles granted).
 *  - Otherwise map Frappe role strings to PPDB buckets. If at least one matches,
 *    expose exactly that set; if none match, return the permissive fallback so
 *    the UI is never gated.
 */
export function usePpdbRole(): PpdbRoleInfo {
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

  const roles = mapPpdbRoles(rawRoles);
  if (roles.length === 0) {
    return permissiveFallback();
  }

  return {
    roles,
    primary: pickPrimary(roles),
    isStaff: roles.includes("staff"),
    isManajer: roles.includes("manajer"),
  };
}
