/**
 * Per-page onboarding content for the Infrastruktur module, written from the
 * facility-desk point of view (operator / tata usaha yang menata gedung,
 * lantai, ruangan, dan utilitas). Centralized so the copy is consistent and
 * editable in one place; each page renders it via the shared <PageGuide>
 * component.
 *
 * Steps are role-tagged with coarse SchoolGuideRole keys to FRAME who each
 * step speaks to — they never hide anything from anyone.
 */
import type { PageGuideStep } from "../guide";
import type { SchoolGuideRole } from "../../lib/schoolGuideRole";

/** Guide step constrained to the school role union so role typos fail to compile. */
export type InfrastrukturGuideStep = Omit<PageGuideStep, "roles"> & {
  roles?: SchoolGuideRole[];
};

/** Identifier for each guided Infrastruktur page. */
export type InfrastrukturGuideId =
  | "dashboard"
  | "daftar-gedung"
  | "lantai"
  | "ruangan"
  | "utilitas";

/** Full guide content for a single page. */
export interface InfrastrukturGuideContent {
  title: string;
  intro: string;
  steps: InfrastrukturGuideStep[];
  tips: string[];
}

export const INFRASTRUKTUR_PAGE_GUIDES: Record<
  InfrastrukturGuideId,
  InfrastrukturGuideContent
> = {
  dashboard: {
    title: "Cara pakai Dashboard Infrastruktur",
    intro:
      "Ringkasan kondisi fisik sekolah: ruangan terpakai, utilisasi, fasilitas rusak, dan utilitas yang nonaktif.",
    steps: [
      {
        title: "Pantau kartu ringkasan",
        detail:
          "Lihat ruangan booked hari ini, utilisasi, fasilitas rusak, dan utilitas anomali sekejap.",
        roles: ["operator", "kepala_sekolah"],
      },
      {
        title: "Cek Perlu Perhatian",
        detail:
          "Fasilitas berstatus Rusak dan utilitas Nonaktif muncul di sini untuk segera ditindak.",
        roles: ["operator", "tata_usaha"],
      },
      {
        title: "Tambah gedung baru",
        detail:
          "Tombol Tambah Gedung membuka form registrasi gedung tanpa pindah halaman.",
        roles: ["operator", "admin"],
      },
      {
        title: "Buka pintasan Aksi Cepat",
        detail:
          "Lompat langsung ke pengelolaan Ruangan, Lantai, atau Utilitas dari kartu pintasan.",
        roles: ["operator"],
      },
    ],
    tips: [
      "Klik kartu statistik untuk lompat ke halaman terkait.",
      "Angka dihitung dari data live ruangan, fasilitas, dan utilitas.",
    ],
  },
  "daftar-gedung": {
    title: "Cara pakai Daftar Gedung",
    intro:
      "Registry seluruh gedung sekolah dalam bentuk kartu; tiap kartu memuat jumlah lantai dan ruangannya.",
    steps: [
      {
        title: "Tambah gedung",
        detail:
          "Tombol Tambah Gedung → isi nama, kode, dan tahun dibangun.",
        roles: ["operator", "admin"],
      },
      {
        title: "Baca ringkasan kartu",
        detail:
          "Setiap kartu menampilkan jumlah lantai dan ruangan milik gedung tersebut.",
        roles: ["operator", "tata_usaha"],
      },
      {
        title: "Buka detail gedung",
        detail:
          "Klik kartu untuk melihat lantai, ruangan, fasilitas, dan utilitas gedung itu.",
        roles: ["operator"],
      },
    ],
    tips: [
      "Kode gedung sebaiknya unik agar mudah ditelusuri.",
      "Lantai dan ruangan dikelola dari dalam halaman detail gedung.",
    ],
  },
  lantai: {
    title: "Cara pakai Daftar Lantai",
    intro:
      "Daftar read-only seluruh lantai per gedung untuk penelusuran cepat.",
    steps: [
      {
        title: "Cari lantai",
        detail:
          "Pakai kotak cari untuk menyaring berdasarkan ID atau gedung.",
        roles: ["operator", "tata_usaha"],
      },
      {
        title: "Urutkan kolom",
        detail:
          "Klik header Gedung atau ID untuk mengurutkan daftar.",
        roles: ["operator"],
      },
      {
        title: "Buka detail gedung",
        detail:
          "Klik baris untuk membuka detail gedung pemilik lantai tersebut.",
        roles: ["operator"],
      },
    ],
    tips: [
      "Halaman ini read-only; tambah atau ubah lantai dari detail gedung.",
    ],
  },
  ruangan: {
    title: "Cara pakai Daftar Ruangan",
    intro:
      "Daftar read-only seluruh ruangan beserta jenis, kapasitas, dan statusnya.",
    steps: [
      {
        title: "Saring per jenis & status",
        detail:
          "Filter Jenis (Kelas, Lab, dll) dan Status (Tersedia, Dipakai, Maintenance).",
        roles: ["operator", "tata_usaha"],
      },
      {
        title: "Cari ruangan",
        detail:
          "Ketik nama atau ID ruangan di kotak cari untuk menemukannya cepat.",
        roles: ["operator", "guru"],
      },
      {
        title: "Buka detail gedung",
        detail:
          "Klik baris untuk membuka detail gedung tempat ruangan berada.",
        roles: ["operator"],
      },
    ],
    tips: [
      "Status Maintenance menandai ruangan yang sedang tidak bisa dipakai.",
      "Halaman ini read-only; kelola ruangan dari detail gedung.",
    ],
  },
  utilitas: {
    title: "Cara pakai Daftar Utilitas",
    intro:
      "Daftar read-only utilitas gedung: PLN, PDAM, internet, gas, beserta provider dan nomor pelanggannya.",
    steps: [
      {
        title: "Saring per jenis",
        detail:
          "Filter berdasarkan jenis utilitas: Listrik, Air, Internet, Gas, atau Lainnya.",
        roles: ["operator", "tata_usaha"],
      },
      {
        title: "Cek provider & nomor pelanggan",
        detail:
          "Kolom Provider dan No. Pelanggan memudahkan saat mengurus tagihan atau gangguan.",
        roles: ["tata_usaha", "bendahara"],
      },
      {
        title: "Buka detail gedung",
        detail:
          "Klik baris untuk membuka detail gedung pemilik utilitas tersebut.",
        roles: ["operator"],
      },
    ],
    tips: [
      "Status selain Aktif menandai utilitas yang perlu dicek.",
      "Halaman ini read-only; tambah atau ubah utilitas dari detail gedung.",
    ],
  },
};
