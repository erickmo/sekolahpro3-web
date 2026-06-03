/**
 * Per-page onboarding content for the Pengaturan module, written from the
 * point of view of the staff configuring the school system. Centralized so the
 * copy is consistent and editable in one place; each page renders it via the
 * shared <PageGuide> component.
 *
 * Steps are role-tagged with the coarse SchoolGuideRole keys to FRAME who each
 * step speaks to — they never hide anything from anyone.
 */
import type { PageGuideStep } from "../guide";
import type { SchoolGuideRole } from "../../lib/schoolGuideRole";

/** Guide step constrained to the school role union so role typos fail to compile. */
export type PengaturanGuideStep = Omit<PageGuideStep, "roles"> & { roles?: SchoolGuideRole[] };

/** Identifier for each guided Pengaturan page. */
export type PengaturanGuideId = "dashboard" | "feature-flag" | "modul";

/** Full guide content for a single page. */
export interface PengaturanGuideContent {
  title: string;
  intro: string;
  steps: PengaturanGuideStep[];
  tips: string[];
}

export const PENGATURAN_PAGE_GUIDES: Record<PengaturanGuideId, PengaturanGuideContent> = {
  dashboard: {
    title: "Cara pakai Pengaturan",
    intro: "Pusat konfigurasi sekolah: profil, akademik, peran, integrasi, keamanan, billing, dan branding.",
    steps: [
      {
        title: "Pilih tab konfigurasi",
        detail: "Pindah antar tab Sekolah, Akademik, Peran, Integrasi, hingga Log untuk membuka kelompok pengaturan.",
        roles: ["admin", "operator"],
      },
      {
        title: "Edit lalu simpan",
        detail: "Klik Edit pada kartu untuk mengubah identitas, alamat, tahun ajaran, atau skala penilaian.",
        roles: ["admin", "tata_usaha"],
      },
      {
        title: "Atur peran & integrasi",
        detail: "Kelola peran pengguna dan sambungkan layanan seperti Dapodik atau payment gateway.",
        roles: ["admin"],
      },
      {
        title: "Ekspor konfigurasi",
        detail: "Tombol Ekspor Konfigurasi mengunduh seluruh pengaturan sebagai berkas JSON untuk arsip.",
        roles: ["admin", "kepala_sekolah"],
      },
    ],
    tips: [
      "Tab Akademik menentukan tahun ajaran dan KKM yang dipakai modul lain.",
      "Identitas sekolah hanya bisa diubah oleh pengguna SaaS.",
      "Cek tab Log untuk melacak siapa mengubah apa.",
    ],
  },
  "feature-flag": {
    title: "Cara pakai Feature Flag",
    intro: "Daftar saklar fitur eksperimental yang bisa dinyalakan atau dimatikan per tenant.",
    steps: [
      {
        title: "Cari flag",
        detail: "Gunakan kotak cari untuk menemukan flag berdasarkan ID atau key.",
        roles: ["admin", "operator"],
      },
      {
        title: "Nyalakan / matikan",
        detail: "Klik toggle Status pada baris untuk mengaktifkan atau menonaktifkan fitur langsung.",
        roles: ["admin"],
      },
      {
        title: "Tambah flag baru",
        detail: "Tombol Tambah Flag membuka form untuk mendaftarkan key dan deskripsi flag.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Key flag dipakai kode aplikasi — ubah hanya bila yakin.",
      "Klik baris untuk membuka detail flag.",
    ],
  },
  modul: {
    title: "Cara pakai Modul Aktif",
    intro: "Atur modul mana yang dipakai sekolah dengan menyalakan atau mematikannya per tenant.",
    steps: [
      {
        title: "Tinjau daftar modul",
        detail: "Lihat semua modul beserta nama dan deskripsinya pada tabel.",
        roles: ["admin", "operator"],
      },
      {
        title: "Aktifkan / nonaktifkan",
        detail: "Klik toggle Status untuk menyalakan atau mematikan modul bagi pengguna sekolah.",
        roles: ["admin"],
      },
      {
        title: "Tambah modul",
        detail: "Tombol Tambah Modul membuka form untuk mendaftarkan modul baru.",
        roles: ["admin"],
      },
    ],
    tips: [
      "Mematikan modul menyembunyikan menunya dari semua pengguna.",
      "Cari modul cepat lewat kotak pencarian di atas tabel.",
    ],
  },
};
