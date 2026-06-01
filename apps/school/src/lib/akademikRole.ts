/**
 * Academic role helper.
 *
 * Derives a coarse academic role (admin / guru / kepala) from the Frappe auth
 * session so the redesign can FRAME the UI per audience (labels, guidance,
 * emphasis) without ever HIDING functionality.
 *
 * Permissive-by-design: when no academic role can be matched, or the session is
 * still loading / unauthenticated / has no roles, every role is granted. Roles
 * here are a presentation hint, never an access gate — access control stays on
 * the backend.
 */
import { useSession } from "@sekolahpro/auth";

/** Coarse academic role buckets understood by the redesign. */
export type AkademikRole = "admin" | "guru" | "kepala";

/** Human-readable Bahasa Indonesia label for each academic role. */
export const ROLE_LABEL: Record<AkademikRole, string> = {
  admin: "Administrator Akademik",
  guru: "Guru",
  kepala: "Kepala Sekolah",
};

/** Shape returned by {@link useAkademikRole}. */
export interface AkademikRoleInfo {
  roles: AkademikRole[];
  primary: AkademikRole;
  isAdmin: boolean;
  isGuru: boolean;
  isKepala: boolean;
}

/**
 * Priority order when picking the single `primary` role from a set.
 * Kepala (oversight) wins over admin (operations) over guru (teaching).
 */
const PRIMARY_PRIORITY: readonly AkademikRole[] = ["kepala", "admin", "guru"];

/** Permissive fallback granting every role (used when nothing matches). */
export const ALL_AKADEMIK_ROLES: readonly AkademikRole[] = ["admin", "guru", "kepala"];

/** Default primary role when no academic role can be inferred. */
const DEFAULT_PRIMARY: AkademikRole = "admin";

/**
 * Frappe role substrings mapped to academic buckets. Matching is done on a
 * normalized (lowercased, spaces/dashes -> underscore) role string so variants
 * like "Kepala Sekolah", "kepala-sekolah" and "kepala_sekolah" all match.
 */
const ROLE_MATCHERS: ReadonlyArray<{ needle: string; role: AkademikRole }> = [
  { needle: "kepala_sekolah", role: "kepala" },
  { needle: "kepala", role: "kepala" },
  { needle: "guru", role: "guru" },
  { needle: "teacher", role: "guru" },
  { needle: "admin_sekolah", role: "admin" },
  { needle: "super_admin", role: "admin" },
  { needle: "operator", role: "admin" },
  { needle: "akademik", role: "admin" },
  { needle: "admin", role: "admin" },
];

/**
 * Normalize a raw Frappe role string for tolerant comparison.
 * Lowercases and collapses spaces and dashes into underscores.
 */
function normalizeRole(raw: string): string {
  return raw.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

/**
 * Map a list of raw Frappe role strings to the set of academic buckets they
 * imply. Returns an empty array when none match.
 *
 * Exported for unit testing and reuse; mirrors `mapFrappeRolesToKeuangan`.
 */
export function mapAkademikRoles(rawRoles: readonly string[]): AkademikRole[] {
  const found = new Set<AkademikRole>();
  for (const raw of rawRoles) {
    const normalized = normalizeRole(raw);
    for (const { needle, role } of ROLE_MATCHERS) {
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
 *
 * Exported for unit testing and reuse; mirrors `pickPrimaryRole` in keuanganRole.
 */
export function pickPrimaryRole(roles: readonly AkademikRole[]): AkademikRole {
  for (const candidate of PRIMARY_PRIORITY) {
    if (roles.includes(candidate)) {
      return candidate;
    }
  }
  return DEFAULT_PRIMARY;
}

/**
 * Build the permissive fallback result that grants every academic role.
 * Used when the session is unavailable, has no roles, or no role matched.
 */
function permissiveFallback(): AkademikRoleInfo {
  return {
    roles: [...ALL_AKADEMIK_ROLES],
    primary: DEFAULT_PRIMARY,
    isAdmin: true,
    isGuru: true,
    isKepala: true,
  };
}

/**
 * Read the current academic role info from the auth session.
 *
 * Resolution:
 *  - If `useSession` is unavailable (no provider) or the session has no roles,
 *    return the permissive fallback (all roles granted).
 *  - Otherwise map Frappe role strings to academic buckets. If at least one
 *    matches, expose exactly that set; if none match, return the permissive
 *    fallback so the UI is never gated.
 */
export function useAkademikRole(): AkademikRoleInfo {
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

  const roles = mapAkademikRoles(rawRoles);
  if (roles.length === 0) {
    return permissiveFallback();
  }

  return {
    roles,
    primary: pickPrimaryRole(roles),
    isAdmin: roles.includes("admin"),
    isGuru: roles.includes("guru"),
    isKepala: roles.includes("kepala"),
  };
}
