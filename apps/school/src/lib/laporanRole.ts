/**
 * Role derivation for the Laporan (Report Center) surface. The report center is
 * Tata-Usaha-centric, but the framing/label adapts for Kepala Sekolah (oversight)
 * and Bendahara (finance reports). Mirrors the shared engine pattern
 * (genericRole.ts) — wrap {@link deriveRoles} with a config, not a re-implementation.
 *
 * `tata_usaha` precedes `kepala` so "Kepala Tata Usaha" stays in the tu bucket.
 * Roles are a presentation hint only; backend gates (laporan_dinas _check_permission,
 * Report.roles) are authoritative.
 */
import { useSession } from "@sekolahpro/auth";
import {
  deriveRoles,
  type DerivedRoles,
  type DeriveRoleConfig,
  type RoleMatcher,
} from "./sessionRole";

export type LaporanRole = "tu" | "kepala" | "bendahara";

export const LAPORAN_ROLE_LABEL: Record<LaporanRole, string> = {
  tu: "Tata Usaha",
  kepala: "Kepala Sekolah",
  bendahara: "Bendahara",
};

const ROLE_MATCHERS: ReadonlyArray<RoleMatcher<LaporanRole>> = [
  { needle: "tata_usaha", role: "tu" },
  { needle: "kepala", role: "kepala" },
  { needle: "bendahara", role: "bendahara" },
  { needle: "keuangan", role: "bendahara" },
  { needle: "yayasan", role: "bendahara" },
  { needle: "operator", role: "tu" },
  { needle: "staff", role: "tu" },
  { needle: "staf", role: "tu" },
];

export const LAPORAN_ROLE_CONFIG: DeriveRoleConfig<LaporanRole> = {
  matchers: ROLE_MATCHERS,
  allRoles: ["tu", "kepala", "bendahara"],
  priority: ["tu", "kepala", "bendahara"],
  defaultPrimary: "tu",
};

/** Pure core: derive laporan role buckets + primary from raw session roles. */
export function laporanRoles(rawRoles: readonly string[]): DerivedRoles<LaporanRole> {
  return deriveRoles(rawRoles, LAPORAN_ROLE_CONFIG);
}

/** React hook: the current session's laporan role. */
export function useLaporanRole(): DerivedRoles<LaporanRole> {
  const session = useSession();
  return laporanRoles(session.roles ?? []);
}
