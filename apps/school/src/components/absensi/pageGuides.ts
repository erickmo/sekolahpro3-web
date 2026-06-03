/**
 * Per-page onboarding content for the Absensi module, written from the staff
 * point of view (wali kelas, guru mapel, tata usaha). Centralized so the copy
 * is consistent and editable in one place; each page renders it via the shared
 * <PageGuide> component.
 *
 * Steps are role-tagged with coarse SchoolGuideRole keys to FRAME who each step
 * speaks to — they never hide anything from anyone.
 */
import type { PageGuideStep } from "../guide";
import type { SchoolGuideRole } from "../../lib/schoolGuideRole";

/** Guide step constrained to the school role union so role typos fail to compile. */
export type AbsensiGuideStep = Omit<PageGuideStep, "roles"> & { roles?: SchoolGuideRole[] };

/** Identifier for each guided Absensi page. */
export type AbsensiGuideId = "dashboard" | "daftar" | "guru" | "pelajaran";

/** Full guide content for a single page. */
export interface AbsensiGuideContent {
  title: string;
  intro: string;
  steps: AbsensiGuideStep[];
  tips: string[];
}

export const ABSENSI_PAGE_GUIDES: Record<AbsensiGuideId, AbsensiGuideContent> = {
  dashboard: {
    title: "Cara pakai Dashboard Absensi",
    intro:
      "Ringkasan kehadiran hari ini: persentase siswa & guru, siswa alpa beruntun, dan kelas di bawah ambang.",
    steps: [
      {
        title: "Pantau kartu ringkasan",
        detail: "Lihat kehadiran siswa & guru hari ini beserta jumlah sesi tercatat.",
        roles: ["kepala_sekolah", "kesiswaan"],
      },
      {
        title: "Tindak lanjuti Perlu Perhatian",
        detail: "Kelas <90%, guru belum input, dan siswa alpa beruntun muncul untuk ditindak.",
        roles: ["wali_kelas", "bk"],
      },
      {
        title: "Pakai Aksi Cepat",
        detail: "Lompat ke input per pelajaran, absensi guru, atau daftar harian.",
        roles: ["guru", "tata_usaha"],
      },
    ],
    tips: [
      "Klik kartu untuk lompat ke daftar terkait.",
      "Angka kehadiran dihitung dari sesi yang sudah tercatat hari ini.",
    ],
  },
  daftar: {
    title: "Cara pakai Absensi Harian",
    intro: "Daftar rekap kehadiran harian per kelas: cari, lihat status, lalu input sesi baru.",
    steps: [
      {
        title: "Input absensi",
        detail: "Tombol Input Absensi → isi tanggal dan kelas, lalu catat hadir/izin/sakit/alpa.",
        roles: ["wali_kelas"],
      },
      {
        title: "Baca kolom H/I/S/A",
        detail: "Jumlah hadir, izin, sakit, dan alpa terlihat per baris; alpa disorot merah.",
        roles: ["wali_kelas", "tata_usaha"],
      },
      {
        title: "Cek status Draft vs Final",
        detail: "Badge status menandai sesi yang belum difinalisasi guru.",
        roles: ["tata_usaha", "kesiswaan"],
      },
    ],
    tips: [
      "Satu baris mewakili satu rekap kelas pada satu tanggal.",
      "Finalkan sesi agar tidak terhitung sebagai belum diinput.",
    ],
  },
  guru: {
    title: "Cara pakai Absensi Guru",
    intro: "Catat kehadiran tenaga pendidik: tanggal, jam masuk/pulang, dan status presensi.",
    steps: [
      {
        title: "Input presensi guru",
        detail: "Tombol Input Absensi → pilih guru, tanggal, jam masuk, dan jam pulang.",
        roles: ["tata_usaha", "operator"],
      },
      {
        title: "Tetapkan status",
        detail: "Status Hadir/Izin/Alpa ditampilkan berwarna di kolom Status.",
        roles: ["tata_usaha"],
      },
      {
        title: "Cari & urutkan",
        detail: "Pakai kotak cari atau klik header Tanggal/Guru untuk mengurutkan.",
        roles: ["operator"],
      },
    ],
    tips: [
      "Isi jam masuk dan pulang agar rekap kehadiran guru akurat.",
      "Urutkan per tanggal untuk meninjau presensi terbaru.",
    ],
  },
  pelajaran: {
    title: "Cara pakai Absensi per Pelajaran",
    intro: "Catat kehadiran siswa per sesi mengajar, terhubung ke mata pelajaran, kelas, dan guru.",
    steps: [
      {
        title: "Input absensi sesi",
        detail: "Tombol Input Absensi → pilih mapel, kelas, dan tanggal, lalu tandai siswa.",
        roles: ["guru"],
      },
      {
        title: "Finalkan sesi",
        detail: "Status Final menandai sesi yang sudah selesai dicatat guru.",
        roles: ["guru"],
      },
      {
        title: "Cari per mapel",
        detail: "Cari berdasarkan nama atau mata pelajaran untuk menemukan sesi cepat.",
        roles: ["kurikulum", "tata_usaha"],
      },
    ],
    tips: [
      "Satu baris mewakili satu sesi pelajaran pada satu tanggal.",
      "Pastikan sesi difinalkan agar masuk hitungan kehadiran dashboard.",
    ],
  },
};
