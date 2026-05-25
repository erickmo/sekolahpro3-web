import { MASTER_TAHUN_AJARAN, MASTER_PENGGUNA } from "./master";
import { SISWA_LIST } from "./siswa";
import { KELAS_LIST } from "./kelas";
import { JADWAL_LIST } from "./jadwal";

export const ONBOARDING_STEPS = [
  {
    id: "jenjang",
    label: "Pilih unit & jenjang",
    description: "Tentukan SD/SMP/SMA aktif untuk tenant.",
    href: "/master/unit-jenjang",
    done: true,
  },
  {
    id: "ta",
    label: "Aktifkan Tahun Ajaran",
    description: "Modul akademik & absensi memerlukan TA aktif.",
    href: "/master/tahun-ajaran",
    done: MASTER_TAHUN_AJARAN.some((t) => t.status === "Aktif"),
  },
  {
    id: "pengguna",
    label: "Undang pengguna",
    description: "Minimal 1 admin + 1 operator.",
    href: "/master/pengguna",
    done: MASTER_PENGGUNA.length >= 2,
  },
  {
    id: "rombel",
    label: "Buat rombongan belajar",
    description: "Definisi kelas paralel + wali kelas.",
    href: "/kelas/rombel",
    done: KELAS_LIST.length > 0,
  },
  {
    id: "siswa",
    label: "Import data siswa",
    description: "Tambah siswa massal atau satuan.",
    href: "/siswa/daftar",
    done: SISWA_LIST.length > 0,
  },
  {
    id: "kurikulum",
    label: "Atur kurikulum & KKM",
    description: "Mapel + nilai minimum per mapel.",
    href: "/akademik/kurikulum",
    done: false,
  },
  {
    id: "jadwal",
    label: "Susun jadwal pelajaran",
    description: "Slot waktu + alokasi guru-kelas-mapel.",
    href: "/jadwal/slot",
    done: JADWAL_LIST.length > 0,
  },
  {
    id: "spp",
    label: "Konfigurasi SPP",
    description: "Nominal & metode pembayaran.",
    href: "/keuangan",
    done: false,
  },
  {
    id: "modul",
    label: "Aktifkan modul opsional",
    description: "Koperasi, Perpustakaan, PPDB.",
    href: "/master/modul",
    done: false,
  },
  {
    id: "tour",
    label: "Lihat panduan singkat",
    description: "Tour fitur utama (3 menit).",
    href: "#",
    done: false,
  },
] as const;
