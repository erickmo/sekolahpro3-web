// jadwalNav — role-filtered navigation for the Jadwal module.
//
// Reuses the academic role buckets (admin/guru/kepala) so role derivation lives
// in one place (lib/akademikRole), and maps them to Jadwal personas:
//   admin  -> Tata Usaha (menyusun + menerbitkan jadwal, kelola override)
//   guru   -> Guru (lihat jadwalnya; halaman penyusun di-route-wall)
//   kepala -> Kepala Sekolah (pengawasan + persetujuan)
//
// Unlike pure framing elsewhere, the Jadwal tournament winners DO hide builder
// pages from Guru/Kepsek by design. Safety net: an unknown role resolves to
// `admin` (see useAkademikRole permissive fallback) so nothing is hidden when
// the session has no matching role.
import type { NavTabGroup } from "../components/GroupedNavTabs";
import type { AkademikRole } from "./akademikRole";

/** Jadwal-facing label per role bucket (Bahasa Indonesia). */
export const JADWAL_ROLE_LABEL: Record<AkademikRole, string> = {
  admin: "Tata Usaha",
  guru: "Guru",
  kepala: "Kepala Sekolah",
};

/** A nav item annotated with the roles allowed to see it. Absent = all roles. */
interface JadwalNavItem {
  to: string;
  label: string;
  exact?: boolean;
  roles?: readonly AkademikRole[];
}

interface JadwalNavGroup {
  label: string;
  items: readonly JadwalNavItem[];
}

// Full Jadwal sub-nav, role-sliced into persona surfaces:
//   kepala -> Pengawasan (Pantauan, Persetujuan)
//   guru   -> Saya (Agenda, Permintaan)
//   admin  -> Susun (Papan, Kotak) + builder (Jadwal/Override)
export const JADWAL_NAV_GROUPS: readonly JadwalNavGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/sch/$sekolah/jadwal", label: "Dashboard", exact: true }],
  },
  {
    label: "Pengawasan",
    items: [
      { to: "/sch/$sekolah/jadwal/pantauan", label: "Pantauan", roles: ["kepala"] },
      { to: "/sch/$sekolah/jadwal/persetujuan", label: "Persetujuan", roles: ["kepala"] },
    ],
  },
  {
    label: "Saya",
    items: [
      { to: "/sch/$sekolah/jadwal/agenda", label: "Agenda Saya", roles: ["guru"] },
      { to: "/sch/$sekolah/jadwal/permintaan", label: "Permintaan Saya", roles: ["guru"] },
    ],
  },
  {
    label: "Susun",
    items: [
      { to: "/sch/$sekolah/jadwal/papan", label: "Papan Susun", roles: ["admin"] },
      { to: "/sch/$sekolah/jadwal/kotak", label: "Kotak Permintaan", roles: ["admin"] },
    ],
  },
  {
    label: "Jadwal",
    items: [
      { to: "/sch/$sekolah/jadwal/daftar", label: "Jadwal Pelajaran", roles: ["admin", "kepala"] },
      { to: "/sch/$sekolah/jadwal/slot", label: "Slot Jadwal", roles: ["admin"] },
    ],
  },
  {
    label: "Override",
    items: [
      { to: "/sch/$sekolah/jadwal/override", label: "Jadwal Override", roles: ["admin", "kepala"] },
      { to: "/sch/$sekolah/jadwal/slot-override", label: "Slot Override", roles: ["admin"] },
    ],
  },
];

/**
 * Filter the Jadwal nav for a role: drop items not granted to it, then drop any
 * group left empty. An item without an explicit `roles` list is shown to all.
 */
export function filterJadwalNav(
  role: AkademikRole,
  groups: readonly JadwalNavGroup[] = JADWAL_NAV_GROUPS,
): NavTabGroup[] {
  const out: NavTabGroup[] = [];
  for (const group of groups) {
    const items = group.items
      .filter((it) => !it.roles || it.roles.includes(role))
      .map(({ roles: _roles, ...rest }) => rest);
    if (items.length > 0) {
      out.push({ label: group.label, items });
    }
  }
  return out;
}
