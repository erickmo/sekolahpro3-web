/**
 * Generic, domain-agnostic role derivation from raw Frappe session roles.
 *
 * Modules (Akademik, Perpustakaan, ...) frame their UI per audience (labels,
 * guidance, emphasis) WITHOUT hiding functionality. This is the shared engine
 * behind those per-module role helpers: normalize raw role strings, map them to
 * coarse buckets via a matcher table, and pick a single primary bucket.
 *
 * Permissive-by-design: when no role matches (or the session has none), every
 * bucket is granted. Roles here are a presentation hint, never an access gate —
 * real access control stays on the backend.
 */

/** A substring needle (matched on a normalized role string) → coarse bucket. */
export interface RoleMatcher<TRole extends string> {
  needle: string;
  role: TRole;
}

/** Per-module configuration for {@link deriveRoles}. */
export interface DeriveRoleConfig<TRole extends string> {
  /** Substring matchers, evaluated in order; first match per raw role wins. */
  matchers: ReadonlyArray<RoleMatcher<TRole>>;
  /** Full bucket set granted by the permissive fallback. */
  allRoles: readonly TRole[];
  /** Priority order when picking the single primary bucket from a set. */
  priority: readonly TRole[];
  /** Primary bucket used by the permissive fallback. */
  defaultPrimary: TRole;
}

/** The buckets derived for the current session. */
export interface DerivedRoles<TRole extends string> {
  roles: TRole[];
  primary: TRole;
}

/**
 * Normalize a raw Frappe role string for tolerant comparison.
 * Lowercases, trims, and collapses runs of spaces/dashes into single
 * underscores so "Kepala Sekolah", "kepala-sekolah" and "kepala_sekolah" match.
 */
export function normalizeRole(raw: string): string {
  return raw.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

/**
 * Map raw Frappe role strings to the set of coarse buckets they imply.
 * Each raw role contributes at most one bucket (first matcher wins).
 * Returns an empty array when none match.
 */
export function mapRoles<TRole extends string>(
  rawRoles: readonly string[],
  matchers: ReadonlyArray<RoleMatcher<TRole>>,
): TRole[] {
  const found = new Set<TRole>();
  for (const raw of rawRoles) {
    const normalized = normalizeRole(raw);
    for (const { needle, role } of matchers) {
      if (normalized.includes(needle)) {
        found.add(role);
        break;
      }
    }
  }
  return [...found];
}

/**
 * Pick the single primary bucket from a set using the priority order.
 * Falls back to `defaultPrimary` when the set contains none of the priorities.
 */
export function pickPrimary<TRole extends string>(
  roles: readonly TRole[],
  priority: readonly TRole[],
  defaultPrimary: TRole,
): TRole {
  for (const candidate of priority) {
    if (roles.includes(candidate)) return candidate;
  }
  return defaultPrimary;
}

/**
 * Derive coarse buckets + primary from raw session roles.
 *
 *  - Empty input → permissive fallback (all buckets granted).
 *  - No matcher hit → permissive fallback (UI is never gated by accident).
 *  - Otherwise → exactly the matched buckets, primary chosen by priority.
 */
export function deriveRoles<TRole extends string>(
  rawRoles: readonly string[],
  config: DeriveRoleConfig<TRole>,
): DerivedRoles<TRole> {
  if (rawRoles.length === 0) {
    return { roles: [...config.allRoles], primary: config.defaultPrimary };
  }
  const roles = mapRoles(rawRoles, config.matchers);
  if (roles.length === 0) {
    return { roles: [...config.allRoles], primary: config.defaultPrimary };
  }
  return { roles, primary: pickPrimary(roles, config.priority, config.defaultPrimary) };
}
