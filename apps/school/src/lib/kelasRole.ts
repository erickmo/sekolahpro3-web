/**
 * Role derivation for the Kelas module's role-sliced surface.
 *
 * The /kelas index renders a different surface per primary role:
 *   kepsek     → Meja Persetujuan (approval desk)
 *   wali_kelas → redirect to the "Kelasku" cockpit (/saya)
 *   tu (else)  → Papan Kelas (the TU builder board)
 *
 * Mirrors the shared engine pattern (genericRole.ts / perpustakaanRole.ts):
 * wrap {@link deriveRoles} with a config — NOT a local re-implementation.
 * Roles are a presentation hint only; backend permissions are authoritative.
 *
 * Matcher order matters: "Kepala Tata Usaha" contains "kepala", so the
 * `tata_usaha` matcher MUST be tried before `kepala`, or a Ka-TU would be
 * mis-read as the headmaster.
 */
import { useSession } from "@sekolahpro/auth";
import {
  deriveRoles,
  type DerivedRoles,
  type DeriveRoleConfig,
  type RoleMatcher,
} from "./sessionRole";

/** Primary surfaces of the Kelas module. */
export type KelasRole = "tu" | "kepsek" | "wali_kelas";

/** Human-readable Bahasa Indonesia label per kelas role. */
export const KELAS_ROLE_LABEL: Record<KelasRole, string> = {
  tu: "Tata Usaha",
  kepsek: "Kepala Sekolah",
  wali_kelas: "Wali Kelas",
};

/**
 * Frappe role substrings → kelas buckets, most-specific first.
 * `tata_usaha` precedes `kepala` to keep "Kepala Tata Usaha" out of the
 * headmaster bucket. A plain "Guru" (non-homeroom) matches nothing → the
 * permissive fallback lands them on the TU board (read-only by backend perms).
 */
const ROLE_MATCHERS: ReadonlyArray<RoleMatcher<KelasRole>> = [
  { needle: "tata_usaha", role: "tu" },
  { needle: "kepala", role: "kepsek" },
  { needle: "wali_kelas", role: "wali_kelas" },
  { needle: "super_admin", role: "tu" },
  { needle: "administrator", role: "tu" },
  { needle: "admin", role: "tu" },
  { needle: "operator", role: "tu" },
  { needle: "staff", role: "tu" },
  { needle: "staf", role: "tu" },
];

/** Priority when one session carries several buckets (named, not inline). */
export const KELAS_ROLE_PRIORITY: readonly KelasRole[] = ["tu", "kepsek", "wali_kelas"];

/**
 * Derivation config. `tu` is the priority head AND the default, so a dual
 * TU+Kepsek user lands on the daily structure board (with a pill to the desk),
 * and an unrecognized/empty session also gets the board. (Dual TU+Kepsek
 * precedence is intentionally TU; confirm before Phase 2 if the org disagrees.)
 */
export const KELAS_ROLE_CONFIG: DeriveRoleConfig<KelasRole> = {
  matchers: ROLE_MATCHERS,
  allRoles: ["tu", "kepsek", "wali_kelas"],
  priority: KELAS_ROLE_PRIORITY,
  defaultPrimary: "tu",
};

/** Pure core: derive kelas buckets + primary from raw session role strings. */
export function kelasRoles(rawRoles: readonly string[]): DerivedRoles<KelasRole> {
  return deriveRoles(rawRoles, KELAS_ROLE_CONFIG);
}

/** True when the session's PRIMARY kelas surface is the Kepsek approval desk. */
export function isKepsekKelas(rawRoles: readonly string[]): boolean {
  return kelasRoles(rawRoles).primary === "kepsek";
}

/** True when the session's PRIMARY kelas surface is the Wali Kelas cockpit. */
export function isWaliKelas(rawRoles: readonly string[]): boolean {
  return kelasRoles(rawRoles).primary === "wali_kelas";
}

/** React hook: the current session's derived kelas roles. */
export function useKelasRole(): DerivedRoles<KelasRole> {
  const session = useSession();
  return kelasRoles(session.roles ?? []);
}
