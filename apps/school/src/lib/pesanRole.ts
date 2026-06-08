/**
 * Role derivation for the Pesan module's role-sliced surface.
 *
 * The /pesan index renders a different surface per primary role:
 *   kepsek → oversight cockpit (PanelKepsek: SLA signals + approval Meja)
 *   guru   → redirect to the roster-born "Pesan Wali" surface (/saya)
 *   tu     → the existing public-contact inbox desk (the permissive default)
 *
 * Mirrors the shared engine pattern (genericRole.ts / berandaRole.ts / kelasRole.ts):
 * wrap {@link deriveRoles} with a config — NOT a local re-implementation. Roles are a
 * presentation hint only; backend permissions are authoritative.
 *
 * Two deliberate divergences from kelasRole.ts, both verified against the codebase:
 *  1. "Wali Kelas" maps to `guru` (not its own bucket): for Pesan a homeroom teacher's
 *     job is the SAME as any teacher — message the wali of their students. kelasRole keeps
 *     wali_kelas separate because Kelas gives it a distinct cockpit; Pesan does not.
 *  2. Priority is kepsek > guru > tu (teaching/oversight win), whereas kelasRole heads
 *     with `tu`. Rationale: the Pesan job belongs to the teacher/headmaster; a guru who
 *     also holds a TU role must still land on their parent-messaging surface. `tu` stays
 *     the DEFAULT (empty/unmatched session) so the existing inbox is never gated away.
 *     (Confirm with the org before Phase 2 if a TU-primary precedence is preferred.)
 *
 * Matcher order matters: "Kepala Tata Usaha" contains "kepala", so the `tata_usaha`
 * matcher MUST precede `kepala`, or a Ka-TU would be mis-read as the headmaster.
 */
import { useSession } from "@sekolahpro/auth";
import {
  deriveRoles,
  type DerivedRoles,
  type DeriveRoleConfig,
  type RoleMatcher,
} from "./sessionRole";

/** Primary surfaces of the Pesan module. */
export type PesanRole = "tu" | "guru" | "kepsek";

/** Human-readable Bahasa Indonesia label per pesan role. */
export const PESAN_ROLE_LABEL: Record<PesanRole, string> = {
  tu: "Tata Usaha",
  guru: "Guru",
  kepsek: "Kepala Sekolah",
};

/**
 * Frappe role substrings → pesan buckets, most-specific first.
 * `tata_usaha` precedes `kepala` to keep "Kepala Tata Usaha" out of the headmaster
 * bucket; the teaching needles (`wali_kelas`/`homeroom`/`guru`/`teacher`/`pengajar`)
 * all collapse to `guru`; admin/operator/staff fall back to `tu`.
 */
const ROLE_MATCHERS: ReadonlyArray<RoleMatcher<PesanRole>> = [
  { needle: "tata_usaha", role: "tu" },
  { needle: "kepala", role: "kepsek" },
  { needle: "principal", role: "kepsek" },
  { needle: "wali_kelas", role: "guru" },
  { needle: "homeroom", role: "guru" },
  { needle: "guru", role: "guru" },
  { needle: "teacher", role: "guru" },
  { needle: "pengajar", role: "guru" },
  { needle: "super_admin", role: "tu" },
  { needle: "administrator", role: "tu" },
  { needle: "admin", role: "tu" },
  { needle: "operator", role: "tu" },
  { needle: "staff", role: "tu" },
  { needle: "staf", role: "tu" },
];

/** Priority when one session carries several buckets: oversight then teaching then desk. */
export const PESAN_ROLE_PRIORITY: readonly PesanRole[] = ["kepsek", "guru", "tu"];

/**
 * Derivation config. `tu` is the DEFAULT (so an empty/unrecognized session keeps the
 * existing inbox desk), but priority heads with `kepsek`/`guru` so an explicit teaching
 * or oversight role wins the surface even when a TU role is also present.
 */
export const PESAN_ROLE_CONFIG: DeriveRoleConfig<PesanRole> = {
  matchers: ROLE_MATCHERS,
  allRoles: ["tu", "guru", "kepsek"],
  priority: PESAN_ROLE_PRIORITY,
  defaultPrimary: "tu",
};

/** Pure core: derive pesan buckets + primary from raw session role strings. */
export function pesanRoles(rawRoles: readonly string[]): DerivedRoles<PesanRole> {
  return deriveRoles(rawRoles, PESAN_ROLE_CONFIG);
}

/** True when the session's PRIMARY pesan surface is the Kepsek oversight cockpit. */
export function isKepsekPesan(rawRoles: readonly string[]): boolean {
  return pesanRoles(rawRoles).primary === "kepsek";
}

/** True when the session's PRIMARY pesan surface is the Guru "Pesan Wali" surface. */
export function isGuruPesan(rawRoles: readonly string[]): boolean {
  return pesanRoles(rawRoles).primary === "guru";
}

/** React hook: the current session's derived pesan roles. */
export function usePesanRole(): DerivedRoles<PesanRole> {
  const session = useSession();
  return pesanRoles(session.roles ?? []);
}
