import type { Pegawai, RolePegawai, StatusPegawai } from "../../data/pegawai";
import { isGuru, isStaff, isDualRole } from "../../data/pegawai";
import { RoleBadges } from "./RoleBadges";

export type RoleFilter = "semua" | "guru" | "staff" | "dual";

export function matchesRoleFilter(p: Pegawai, filter: RoleFilter): boolean {
  if (filter === "semua") return true;
  if (filter === "guru") return isGuru(p) && !isDualRole(p);
  if (filter === "staff") return isStaff(p) && !isDualRole(p);
  return isDualRole(p);
}

export function matchesSearch(p: Pegawai, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return p.nip.toLowerCase().includes(q) || p.namaLengkap.toLowerCase().includes(q);
}

export function matchesStatus(p: Pegawai, status: StatusPegawai | "semua"): boolean {
  return status === "semua" || p.status === status;
}

export function summaryUtama(p: Pegawai): string {
  const dept = p.staff?.departemen;
  const mapel = p.guru?.mapelPengampu[0] ?? p.guru?.jenisPtk;
  if (dept && mapel) return `${mapel} · ${dept}`;
  return mapel ?? dept ?? "—";
}

export const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "guru", label: "Guru" },
  { value: "staff", label: "Staff" },
  { value: "dual", label: "Dual-role" },
];

export { RoleBadges };
export type { Pegawai, RolePegawai };
