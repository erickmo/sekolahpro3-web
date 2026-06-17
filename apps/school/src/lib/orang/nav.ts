// Grouped sub-navigation for the Orang (Siswa & Staff) modules, consumed by
// <GroupedNavTabs groups={...} />. Pure data only.
//
// Every `to` below was verified to have an existing route file under
// src/routes/ at authoring time (ls of sch.$sekolah.siswa.* and
// sch.$sekolah.staff.*). Do NOT add a route here whose file does not exist —
// TanStack Router's typed Link would break.
//
// Routes confirmed present:
//   Siswa: siswa(index), daftar, wali, mutasi-masuk,
//          mutasi, kelulusan, ijazah, persetujuan, perubahan-data
//   (rombel + pendaftaran moved under /akademik in Fase 2 single-door.)
//   Staff: staff(index), daftar, jabatan, mapel-pengampu, penugasan,
//          sk-mengajar, sk-jabatan, berkas

import type { NavTabGroup } from "../../components/GroupedNavTabs";

// Scope prefix every route shares; the dashboard index is the bare scope root.
const SISWA = "/sch/$sekolah/siswa";
const STAFF = "/sch/$sekolah/staff";

/** Sub-nav groups for the Siswa module. */
export const SISWA_NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: SISWA, label: "Dashboard", exact: true }],
  },
  {
    label: "Data Pokok",
    items: [
      { to: `${SISWA}/daftar`, label: "Daftar Siswa" },
      { to: `${SISWA}/wali`, label: "Wali Siswa" },
      // Anggota Rombel moved to /akademik/$ta/kelas/anggota (Fase 2 single-door).
    ],
  },
  {
    label: "Penerimaan",
    items: [
      // Pendaftaran Siswa moved to /akademik/$ta/pendaftaran (Fase 2 single-door).
      { to: `${SISWA}/mutasi-masuk`, label: "Mutasi Masuk" },
    ],
  },
  {
    label: "Kelulusan & Keluar",
    items: [
      { to: `${SISWA}/mutasi`, label: "Mutasi" },
      { to: `${SISWA}/kelulusan`, label: "Kelulusan" },
      { to: `${SISWA}/ijazah`, label: "Ijazah" },
    ],
  },
  {
    label: "Administrasi",
    items: [
      { to: `${SISWA}/persetujuan`, label: "Persetujuan Wali" },
      { to: `${SISWA}/perubahan-data`, label: "Perubahan Data" },
    ],
  },
];

/** Sub-nav groups for the Staff (Kepegawaian) module. */
export const STAFF_NAV_GROUPS: NavTabGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: STAFF, label: "Dashboard", exact: true }],
  },
  {
    label: "Data Pokok",
    items: [
      { to: `${STAFF}/daftar`, label: "Daftar Pegawai" },
      { to: `${STAFF}/jabatan`, label: "Jabatan" },
    ],
  },
  {
    label: "Penugasan Mengajar",
    items: [
      { to: `${STAFF}/mapel-pengampu`, label: "Mapel Pengampu" },
      { to: `${STAFF}/penugasan`, label: "Penugasan" },
      { to: `${STAFF}/sk-mengajar`, label: "SK Mengajar" },
    ],
  },
  {
    label: "Kepegawaian",
    items: [
      { to: `${STAFF}/sk-jabatan`, label: "SK Jabatan" },
      { to: `${STAFF}/berkas`, label: "Berkas" },
    ],
  },
];
