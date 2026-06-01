/**
 * Settings role helper for the Pengaturan redesign.
 *
 * Derives a coarse presentation role (kepala / tu / bendahara / it / auditor)
 * from the Frappe auth session so the redesign can FRAME the UI per audience
 * (labels, guidance, emphasis) without ever HIDING functionality.
 *
 * Permissive-by-design: when no role can be matched, or the session is loading /
 * unauthenticated / has no roles, every role is granted. Roles here are a
 * presentation hint, never an access gate — access control stays on the backend
 * (Frappe permissions).
 *
 * One exception: `canEditIdentitas` preserves the SaaS-only gate from the old
 * route (only SekolahPro/System administrators may edit the school identity).
 *
 * Mirrors lib/keuanganRole.ts (the unified-hub reference pattern).
 */
import { useSession } from "@sekolahpro/auth";

/** Coarse settings role buckets understood by the Pengaturan redesign. */
export type PengaturanRole = "kepala" | "tu" | "bendahara" | "it" | "auditor";

/** Every role, used by the permissive fallback and full-access roles. */
export const ALL_PENGATURAN_ROLES: readonly PengaturanRole[] = [
  "kepala",
  "tu",
  "bendahara",
  "it",
  "auditor",
];

/** Human-readable Bahasa Indonesia label for each settings role. */
export const ROLE_LABEL: Record<PengaturanRole, string> = {
  kepala: "Kepala Sekolah",
  tu: "Tata Usaha",
  bendahara: "Bendahara",
  it: "Admin IT",
  auditor: "Auditor",
};

/**
 * Frappe roles that grant SaaS-level identity editing. Mirrors the old route's
 * useCanEditIdentitas gate — only these may edit the school identity card.
 */
const SAAS_IDENTITAS_ROLES: readonly string[] = [
  "SekolahPro Admin",
  "SekolahPro Manager",
  "System Manager",
];

/** Shape returned by {@link usePengaturanRole}. */
export interface PengaturanRoleInfo {
  roles: PengaturanRole[];
  primary: PengaturanRole;
  isKepala: boolean;
  isTU: boolean;
  isBendahara: boolean;
  isIT: boolean;
  isAuditor: boolean;
  /** SaaS-only gate: may the user edit the school identity card? */
  canEditIdentitas: boolean;
}

/**
 * Priority order when picking the single `primary` role from a set.
 * Kepala (oversight) > IT (system owner) > TU (operator) > bendahara > auditor.
 */
const PRIMARY_PRIORITY: readonly PengaturanRole[] = ["kepala", "it", "tu", "bendahara", "auditor"];

/** Default primary role when no settings role can be inferred. */
const DEFAULT_PRIMARY: PengaturanRole = "kepala";

/**
 * Frappe roles that imply full access to the whole settings hub. When any of
 * these is present the user is granted every presentation role.
 */
const FULL_ACCESS_NEEDLES: readonly string[] = [
  "super_admin",
  "admin_sekolah",
  "administrator",
  "system_manager",
];

/**
 * Frappe role substrings mapped to settings buckets. Matching is done on a
 * normalized (lowercased, spaces/dashes -> underscore) role string so variants
 * like "Kepala Sekolah", "kepala-sekolah" and "kepala_sekolah" all match.
 * Order matters: more specific needles come before broader ones.
 */
const ROLE_MATCHERS: ReadonlyArray<{ needle: string; role: PengaturanRole }> = [
  { needle: "kepala_sekolah", role: "kepala" },
  { needle: "kepala", role: "kepala" },
  { needle: "principal", role: "kepala" },
  { needle: "tata_usaha", role: "tu" },
  { needle: "operator", role: "tu" },
  { needle: "staff", role: "tu" },
  { needle: "bendahara", role: "bendahara" },
  { needle: "treasurer", role: "bendahara" },
  { needle: "finance", role: "bendahara" },
  // Auditor MUST precede the broad "it" needle — "auditor" contains "it".
  { needle: "auditor", role: "auditor" },
  { needle: "it_admin", role: "it" },
  { needle: "sysadmin", role: "it" },
  { needle: "teknisi", role: "it" },
  { needle: "it", role: "it" },
];

/**
 * Normalize a raw Frappe role string for tolerant comparison.
 * Lowercases and collapses spaces and dashes into underscores.
 */
function normalizeRole(raw: string): string {
  return raw.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

/**
 * Map a list of raw Frappe role strings to the set of settings buckets they
 * imply. A full-access role short-circuits to every role.
 *
 * @param rawRoles raw Frappe role strings from the session.
 * @returns the deduped set of settings roles, or [] when none match.
 */
export function mapFrappeRolesToPengaturan(rawRoles: readonly string[]): PengaturanRole[] {
  const normalized = rawRoles.map(normalizeRole);

  // Full-access roles (super admin, school admin) see the whole hub.
  if (normalized.some((r) => FULL_ACCESS_NEEDLES.some((n) => r.includes(n)))) {
    return [...ALL_PENGATURAN_ROLES];
  }

  const found = new Set<PengaturanRole>();
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
 *
 * @param roles the user's resolved settings roles.
 * @returns the highest-priority role present, or {@link DEFAULT_PRIMARY}.
 */
export function pickPrimaryRole(roles: readonly PengaturanRole[]): PengaturanRole {
  for (const candidate of PRIMARY_PRIORITY) {
    if (roles.includes(candidate)) {
      return candidate;
    }
  }
  return DEFAULT_PRIMARY;
}

/**
 * Whether any raw role grants SaaS-level identity editing.
 *
 * @param rawRoles raw Frappe role strings from the session.
 * @returns true only when a SaaS administrator role is present.
 */
function canEditIdentitasFor(rawRoles: readonly string[]): boolean {
  return rawRoles.some((r) => SAAS_IDENTITAS_ROLES.includes(r));
}

/**
 * Friendly Bahasa Indonesia label for a role key (e.g. for PageGuide roleLabel).
 * Falls back to the raw string when the key is not a known role.
 *
 * @param role a role key (ideally a PengaturanRole).
 * @returns the human-readable label.
 */
export function pengaturanRoleLabel(role: string): string {
  return ROLE_LABEL[role as PengaturanRole] ?? role;
}

/** Build the permissive fallback result that grants every settings role. */
function permissiveFallback(): PengaturanRoleInfo {
  return {
    roles: [...ALL_PENGATURAN_ROLES],
    primary: DEFAULT_PRIMARY,
    isKepala: true,
    isTU: true,
    isBendahara: true,
    isIT: true,
    isAuditor: true,
    // No session => not a SaaS user => identity stays read-only.
    canEditIdentitas: false,
  };
}

/**
 * Read the current settings role info from the auth session.
 *
 * Resolution mirrors {@link useKeuanganRole}: missing provider, empty roles, or
 * no match all yield the permissive fallback so the UI is never gated. The
 * SaaS-only `canEditIdentitas` gate is evaluated against the raw roles.
 *
 * @returns the resolved {@link PengaturanRoleInfo}.
 */
export function usePengaturanRole(): PengaturanRoleInfo {
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

  const canEditIdentitas = canEditIdentitasFor(rawRoles);
  const roles = mapFrappeRolesToPengaturan(rawRoles);
  if (roles.length === 0) {
    // No presentation role matched, but a SaaS admin may still edit identity.
    return { ...permissiveFallback(), canEditIdentitas };
  }

  return {
    roles,
    primary: pickPrimaryRole(roles),
    isKepala: roles.includes("kepala"),
    isTU: roles.includes("tu"),
    isBendahara: roles.includes("bendahara"),
    isIT: roles.includes("it"),
    isAuditor: roles.includes("auditor"),
    canEditIdentitas,
  };
}
