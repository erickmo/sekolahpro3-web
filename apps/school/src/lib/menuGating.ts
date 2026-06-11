/**
 * Sidebar visibility gating for the school shell.
 *
 * NOTE: This is UI-only sidebar gating, NOT a security boundary.
 * Backend permissions are authoritative — these rules only control
 * which sidebar links are rendered for a given role.
 */

export const ROLE_MENU_MAP: Record<string, string[]> = {
  super_admin: ["*"],
  admin_sekolah: ["*"],
  kepala_sekolah: [
    "/",
    "/siswa",
    "/staff",
    "/kelas",
    "/akademik",
    "/ekstrakurikuler",
    "/jadwal",
    "/absensi",
    "/ppdb",
    "/keuangan",
    "/akuntansi",
    "/laporan",
    "/pickup-verify",
    "/aset",
    "/master",
    "/situs",
    "/pengaturan",
  ],
  operator: ["/", "/siswa", "/staff", "/kelas", "/jadwal", "/absensi", "/ppdb", "/ekstrakurikuler", "/akademik", "/pesan", "/pickup-verify", "/aset"],
  guru: ["/", "/siswa", "/kelas", "/akademik", "/ekstrakurikuler", "/master", "/jadwal", "/absensi", "/pesan"],
  bendahara: ["/", "/siswa", "/keuangan", "/akuntansi", "/koperasi", "/ppdb", "/akademik", "/laporan", "/pesan"],
  pustakawan: ["/", "/perpustakaan", "/siswa", "/pesan"],
  petugas_koperasi: ["/", "/koperasi", "/siswa", "/pesan"],
  manajer_aset: ["/", "/aset", "/siswa", "/pesan", "/laporan"],
  petugas_aset: ["/", "/aset", "/siswa", "/pesan"],
};

export function canSee(to: string, roles: string[]): boolean {
  for (const role of roles) {
    const allowed = ROLE_MENU_MAP[role];
    if (!allowed) continue;
    if (allowed.includes("*")) return true;
    if (allowed.includes(to)) return true;
  }
  return false;
}
