/**
 * Domain-agnostic role label for module context bars.
 *
 * Most modules frame their chrome with a "who am I" badge but have no dedicated
 * role taxonomy of their own (unlike aset/perpustakaan/akademik). This helper
 * derives one coarse, school-wide role label from the Frappe session using the
 * shared {@link deriveRoles} engine — a single matcher table, not per-module
 * buckets. Roles are a presentation hint only; access control stays on the
 * backend (permissive-by-design fallback grants all buckets).
 */
import { useSession } from "@sekolahpro/auth";
import { deriveRoles, type DeriveRoleConfig, type RoleMatcher } from "./sessionRole";

/** Coarse, school-wide role buckets used purely for the context-bar badge. */
export type GenericRole = "admin" | "kepala" | "guru" | "staf";

/** Human-readable Bahasa Indonesia label per generic role. */
export const ROLE_LABEL: Record<GenericRole, string> = {
  admin: "Administrator",
  kepala: "Kepala Sekolah",
  guru: "Guru",
  staf: "Staf",
};

/**
 * Frappe role substrings → generic buckets, most-specific first. Matched on a
 * normalized (lowercased, spaces/dashes → underscore) role string.
 */
const ROLE_MATCHERS: ReadonlyArray<RoleMatcher<GenericRole>> = [
  { needle: "kepala", role: "kepala" },
  { needle: "super_admin", role: "admin" },
  { needle: "administrator", role: "admin" },
  { needle: "admin", role: "admin" },
  { needle: "guru", role: "guru" },
  { needle: "teacher", role: "guru" },
  { needle: "wali_kelas", role: "guru" },
  { needle: "tata_usaha", role: "staf" },
  { needle: "staff", role: "staf" },
  { needle: "staf", role: "staf" },
  { needle: "operator", role: "staf" },
];

/**
 * Shared derivation config. Default primary is `admin` so a session with no
 * recognizable role (e.g. a dev/super user) reads as Administrator rather than a
 * misleadingly narrow label. Priority: kepala > admin > guru > staf.
 */
export const GENERIC_ROLE_CONFIG: DeriveRoleConfig<GenericRole> = {
  matchers: ROLE_MATCHERS,
  allRoles: ["admin", "kepala", "guru", "staf"],
  priority: ["kepala", "admin", "guru", "staf"],
  defaultPrimary: "admin",
};

/** Pure core: resolve the generic role label from raw session role strings. */
export function genericRoleLabel(rawRoles: readonly string[]): string {
  const { primary } = deriveRoles(rawRoles, GENERIC_ROLE_CONFIG);
  return ROLE_LABEL[primary];
}

/** React hook: the current session's generic role label for a context bar. */
export function useGenericRoleLabel(): string {
  const session = useSession();
  return genericRoleLabel(session.roles ?? []);
}
