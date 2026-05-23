import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export interface PillarDetail {
  key: string;
  title: string;
  tagline: string;
  description: string;
  users: string[];
  features: string[];
  workflow: string[];
}

export interface FiturContent {
  hero: { eyebrow: string; title_main: string; title_italic: string; lead: string };
  cta: {
    title: string;
    body: string;
    primary: { label: string; url: string };
    secondary: { label: string; url: string };
  };
  pillars: PillarDetail[];
}

const STATIC_FALLBACK: FiturContent = {
  hero: {
    eyebrow: "— Fitur",
    title_main: "Enam pilar untuk",
    title_italic: "satu sekolah utuh.",
    lead: "Setiap pilar bisa berdiri sendiri, namun saling memperkuat. Pakai sesuai kebutuhan sekolah Anda.",
  },
  cta: {
    title: "Mulai dari satu pilar, kembangkan saat siap.",
    body: "Anda tidak harus pakai semua dari awal. Tim kami bantu pilih pilar dengan dampak tercepat untuk sekolah Anda.",
    primary: { label: "Konsultasi Gratis", url: "/kontak?utm=fitur" },
    secondary: { label: "Lihat Sekolah Pengguna", url: "/partner" },
  },
  pillars: [
    {
      key: "akademik",
      title: "Akademik",
      tagline: "Dari jadwal kelas sampai rapor.",
      description:
        "Semua aktivitas akademik dalam satu alur: penjadwalan otomatis, presensi harian, input nilai per mata pelajaran, sampai cetak rapor sesuai format Kurikulum Merdeka.",
      users: ["Guru", "Wali Kelas", "Kurikulum", "Kepala Sekolah"],
      features: [
        "Jadwal otomatis berdasarkan kapasitas kelas + ketersediaan guru",
        "Presensi harian via QR atau input cepat oleh wali kelas",
        "Bank soal & ujian online (PG, esai, hybrid)",
        "Buku nilai per fase + rapor PDF cetak/digital",
        "Catatan capaian profil pelajar Pancasila",
      ],
      workflow: ["Susun jadwal", "Catat presensi", "Input nilai", "Cetak rapor"],
    },
    {
      key: "ppdb",
      title: "PPDB",
      tagline: "Penerimaan siswa baru, tanpa antrean.",
      description:
        "Formulir online, seleksi otomatis berdasarkan zona/raport, pembayaran daftar ulang via QRIS, sampai SK penerimaan — semuanya satu alur.",
      users: ["Panitia PPDB", "Calon Orangtua", "Tata Usaha"],
      features: [
        "Formulir publik dengan unggah dokumen",
        "Verifikasi & seleksi otomatis berbasis kuota",
        "Pembayaran daftar ulang QRIS/virtual account",
        "SK penerimaan + nomor induk otomatis",
        "Statistik real-time kuota per jurusan",
      ],
      workflow: ["Daftar online", "Seleksi", "Bayar daftar ulang", "Terbit NIS"],
    },
    {
      key: "keuangan",
      title: "Keuangan",
      tagline: "Tagihan jelas, kasir cepat, laporan akurat.",
      description:
        "SPP bulanan, tagihan ekstra, pembayaran tunai/QRIS, sampai laporan kas harian — terintegrasi dengan data siswa dan rapor.",
      users: ["Bendahara", "Tata Usaha", "Orangtua", "Kepala Sekolah"],
      features: [
        "Master tagihan per kelas + diskon individual",
        "Pembayaran tunai, QRIS, virtual account, atau split",
        "Riwayat pembayaran orangtua di portal & WhatsApp",
        "Tutup kas harian + neraca bulanan otomatis",
        "Tunggakan jatuh tempo terdeteksi otomatis",
      ],
      workflow: ["Terbitkan tagihan", "Terima pembayaran", "Tutup kas", "Cetak laporan"],
    },
    {
      key: "koperasi",
      title: "Koperasi & Kantin",
      tagline: "Kartu e-money siswa + kasir cashless.",
      description:
        "Top-up saldo siswa via orangtua, transaksi tap-card di kantin/koperasi, laporan harian per stan — orangtua tahu uang anak kemana.",
      users: ["Pengelola Koperasi", "Penjaga Kantin", "Orangtua", "Siswa"],
      features: [
        "Top-up saldo siswa via QRIS oleh orangtua",
        "Terminal kasir Android + reader kartu RFID",
        "Limit harian per siswa (atur oleh orangtua)",
        "Riwayat transaksi siswa real-time",
        "Laporan stok & penjualan per stan",
      ],
      workflow: ["Top-up saldo", "Tap kartu", "Transaksi tercatat", "Laporan harian"],
    },
    {
      key: "komunikasi",
      title: "Komunikasi",
      tagline: "Pesan tepat sasaran ke orangtua.",
      description:
        "Pengumuman per kelas/sekolah, rapor digital, notifikasi tagihan & presensi anak — terkirim via aplikasi orangtua dan WhatsApp resmi.",
      users: ["Wali Kelas", "Humas", "Orangtua"],
      features: [
        "Broadcast pengumuman per kelas/jenjang/seluruh sekolah",
        "Template WhatsApp resmi (terverifikasi Meta)",
        "Rapor & raport tengah semester PDF digital",
        "Notifikasi presensi & tagihan otomatis",
        "Chat 2 arah wali kelas ↔ orangtua",
      ],
      workflow: ["Susun pesan", "Pilih audiens", "Kirim", "Pantau dibaca"],
    },
    {
      key: "data-induk",
      title: "Data Induk",
      tagline: "Satu sumber kebenaran data sekolah.",
      description:
        "Siswa, guru, kelas, dan struktur sekolah dalam satu master data — sinkron dengan Dapodik, dan jadi sumber untuk semua modul lain.",
      users: ["Tata Usaha", "Operator Dapodik", "Kepala Sekolah"],
      features: [
        "Master siswa dengan riwayat akademik lintas tahun",
        "Master guru + SK pengajaran",
        "Sinkronisasi Dapodik (impor & ekspor)",
        "Master kelas, jenjang, jurusan, tahun ajaran",
        "Riwayat perubahan terjamin (audit log)",
      ],
      workflow: ["Impor Dapodik", "Edit lokal", "Validasi", "Ekspor ulang"],
    },
  ],
};

interface ApiShape {
  hero_eyebrow?: string;
  hero_title_main?: string;
  hero_title_italic?: string;
  hero_lead?: string;
  cta_title?: string;
  cta_body?: string;
  cta_primary_label?: string;
  cta_primary_url?: string;
  cta_secondary_label?: string;
  cta_secondary_url?: string;
  pillars?: {
    key?: string;
    title?: string;
    tagline?: string;
    description?: string;
    users?: string[];
    features?: string[];
    workflow?: string[];
    sort_order?: number;
  }[];
}

function map(raw: ApiShape): FiturContent {
  const pillars = [...(raw.pillars ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .filter((p) => p.key && p.title)
    .map<PillarDetail>((p) => ({
      key: p.key as string,
      title: p.title as string,
      tagline: p.tagline ?? "",
      description: p.description ?? "",
      users: Array.isArray(p.users) ? p.users : [],
      features: Array.isArray(p.features) ? p.features : [],
      workflow: Array.isArray(p.workflow) ? p.workflow : [],
    }));

  return {
    hero: {
      eyebrow: raw.hero_eyebrow ?? STATIC_FALLBACK.hero.eyebrow,
      title_main: raw.hero_title_main ?? STATIC_FALLBACK.hero.title_main,
      title_italic: raw.hero_title_italic ?? STATIC_FALLBACK.hero.title_italic,
      lead: raw.hero_lead ?? STATIC_FALLBACK.hero.lead,
    },
    cta: {
      title: raw.cta_title ?? STATIC_FALLBACK.cta.title,
      body: raw.cta_body ?? STATIC_FALLBACK.cta.body,
      primary: {
        label: raw.cta_primary_label ?? STATIC_FALLBACK.cta.primary.label,
        url: raw.cta_primary_url ?? STATIC_FALLBACK.cta.primary.url,
      },
      secondary: {
        label: raw.cta_secondary_label ?? STATIC_FALLBACK.cta.secondary.label,
        url: raw.cta_secondary_url ?? STATIC_FALLBACK.cta.secondary.url,
      },
    },
    pillars: pillars.length ? pillars : STATIC_FALLBACK.pillars,
  };
}

export function useFiturContent(): FiturContent {
  const [content, setContent] = useState<FiturContent>(STATIC_FALLBACK);
  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/method/sekolahpro.api.fitur.get_content`, { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { message?: ApiShape }) => {
        if (cancelled || !body?.message) return;
        setContent(map(body.message));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return content;
}
