/**
 * Extracurricular role helper.
 *
 * Derives a coarse ekskul role (pembina / koordinator / kepala) from the Frappe
 * auth session so the UI can FRAME per audience (labels, guidance, emphasis)
 * without ever HIDING functionality. Clones the proven akademikRole pattern.
 *
 * Permissive-by-design: when no ekskul role can be matched, or the session is
 * still loading / unauthenticated / has no roles, every role is granted. Roles
 * here are a presentation hint, never an access gate — access control stays on
 * the backend (Frappe doctype permissions + tenant_registry scoping).
 */
import { useSession } from "@sekolahpro/auth";

/** Coarse ekskul role buckets understood by the redesign. */
export type EkskulRole = "pembina" | "koordinator" | "kepala";

/** Human-readable Bahasa Indonesia label for each ekskul role. */
export const ROLE_LABEL: Record<EkskulRole, string> = {
  pembina: "Pembina Ekstrakurikuler",
  koordinator: "Koordinator Ekstrakurikuler",
  kepala: "Kepala Sekolah",
};

/** Shape returned by {@link useEkskulRole}. */
export interface EkskulRoleInfo {
  roles: EkskulRole[];
  primary: EkskulRole;
  isPembina: boolean;
  isKoordinator: boolean;
  isKepala: boolean;
}

/**
 * Priority order when picking the single `primary` role from a set.
 * Kepala (oversight) wins over koordinator (operations) over pembina (coaching).
 */
const PRIMARY_PRIORITY: readonly EkskulRole[] = ["kepala", "koordinator", "pembina"];

/** Permissive fallback granting every role (used when nothing matches). */
export const ALL_EKSKUL_ROLES: readonly EkskulRole[] = ["pembina", "koordinator", "kepala"];

/** Default primary role when no ekskul role can be inferred. */
const DEFAULT_PRIMARY: EkskulRole = "koordinator";

/**
 * Frappe role substrings mapped to ekskul buckets. Matching is done on a
 * normalized (lowercased, spaces/dashes -> underscore) role string so variants
 * like "Pembina Ekstrakurikuler", "pembina-ekskul" all match. First match wins
 * per raw role, so coordinator/principal matchers are listed before the broad
 * teaching matchers to avoid "Koordinator Ekstrakurikuler" leaking to pembina.
 */
const ROLE_MATCHERS: ReadonlyArray<{ needle: string; role: EkskulRole }> = [
  { needle: "kepala_sekolah", role: "kepala" },
  { needle: "kepala", role: "kepala" },
  { needle: "koordinator", role: "koordinator" },
  { needle: "kesiswaan", role: "koordinator" },
  { needle: "pembina", role: "pembina" },
  { needle: "pelatih", role: "pembina" },
  { needle: "coach", role: "pembina" },
  { needle: "ekskul", role: "pembina" },
  { needle: "ekstrakurikuler", role: "pembina" },
  { needle: "guru", role: "pembina" },
  { needle: "teacher", role: "pembina" },
  { needle: "admin_sekolah", role: "koordinator" },
  { needle: "super_admin", role: "koordinator" },
  { needle: "operator", role: "koordinator" },
  { needle: "admin", role: "koordinator" },
];

/**
 * Normalize a raw Frappe role string for tolerant comparison.
 * Lowercases and collapses spaces and dashes into underscores.
 */
function normalizeRole(raw: string): string {
  return raw.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

/**
 * Map a list of raw Frappe role strings to the set of ekskul buckets they
 * imply. Returns an empty array when none match.
 *
 * Exported for unit testing and reuse; mirrors `mapAkademikRoles`.
 */
export function mapEkskulRoles(rawRoles: readonly string[]): EkskulRole[] {
  const found = new Set<EkskulRole>();
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
 */
export function pickPrimaryRole(roles: readonly EkskulRole[]): EkskulRole {
  for (const candidate of PRIMARY_PRIORITY) {
    if (roles.includes(candidate)) {
      return candidate;
    }
  }
  return DEFAULT_PRIMARY;
}

/**
 * Build the permissive fallback result that grants every ekskul role.
 * Used when the session is unavailable, has no roles, or no role matched.
 */
function permissiveFallback(): EkskulRoleInfo {
  return {
    roles: [...ALL_EKSKUL_ROLES],
    primary: DEFAULT_PRIMARY,
    isPembina: true,
    isKoordinator: true,
    isKepala: true,
  };
}

/**
 * Read the current ekskul role info from the auth session.
 *
 * Resolution:
 *  - If `useSession` is unavailable (no provider) or the session has no roles,
 *    return the permissive fallback (all roles granted).
 *  - Otherwise map Frappe role strings to ekskul buckets. If at least one
 *    matches, expose exactly that set; if none match, return the permissive
 *    fallback so the UI is never gated.
 */
export function useEkskulRole(): EkskulRoleInfo {
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

  const roles = mapEkskulRoles(rawRoles);
  if (roles.length === 0) {
    return permissiveFallback();
  }

  return {
    roles,
    primary: pickPrimaryRole(roles),
    isPembina: roles.includes("pembina"),
    isKoordinator: roles.includes("koordinator"),
    isKepala: roles.includes("kepala"),
  };
}
