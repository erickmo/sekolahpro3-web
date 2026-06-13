// Struktur navigasi sidebar khusus shell Koperasi (`/kop/$sekolah`).
//
// Path disimpan sebagai suffix bare (relatif terhadap `/kop/$sekolah`), lalu
// `kopScopedTo` / `kopActivePath` (lihat ./scoped) membentuk target & active
// state. Dipakai oleh root layout untuk merender sidebar koperasi-only —
// terpisah dari menu sekolah.

export type KoperasiMode = "syariah" | "konvensional";

export interface KoperasiNavItem {
  /** Suffix bare relatif `/kop/$sekolah` (mis. "/daftar", "/" untuk dashboard). */
  to: string;
  label: string;
  /** Hanya tampil untuk mode ini; absen = kedua mode. */
  mode?: KoperasiMode;
  /** Label alternatif saat mode konvensional (mis. "Akad" → "Pinjaman"). */
  labelKonvensional?: string;
}

export interface KoperasiNavSection {
  title: string;
  items: KoperasiNavItem[];
  /** Section hanya tampil untuk mode ini; absen = kedua mode. */
  mode?: KoperasiMode;
}

export const KOPERASI_NAV: KoperasiNavSection[] = [
  {
    title: "Utama",
    items: [{ to: "/", label: "Dashboard" }],
  },
  {
    title: "Anggota & Rekening",
    items: [
      { to: "/onboarding", label: "Pendaftaran Anggota" },
      { to: "/nasabah", label: "Nasabah" },
      { to: "/daftar", label: "Anggota" },
      { to: "/rekening", label: "Rekening" },
    ],
  },
  {
    title: "Operasional",
    items: [
      { to: "/workspace", label: "Layanan Cepat" },
      { to: "/transaksi", label: "Transaksi" },
      { to: "/kas-teller", label: "Kas Teller" },
      { to: "/kartu", label: "Kartu RFID" },
      { to: "/emoney", label: "E-Money" },
      { to: "/wallet", label: "Wallet E-Money" },
    ],
  },
  {
    title: "Pembiayaan",
    items: [
      { to: "/pembiayaan", label: "Akad", labelKonvensional: "Pinjaman" },
      { to: "/angsuran", label: "Angsuran" },
      { to: "/suku-bunga", label: "Suku Bunga", mode: "konvensional" },
    ],
  },
  {
    title: "Baitul Maal",
    mode: "syariah",
    items: [
      { to: "/zis", label: "ZIS" },
      { to: "/zis-penyaluran", label: "Penyaluran" },
      { to: "/zis-program", label: "Program" },
      { to: "/wakaf", label: "Wakaf" },
    ],
  },
  {
    title: "Admin",
    items: [
      { to: "/persetujuan", label: "Persetujuan" },
      { to: "/period-close", label: "Tutup Periode" },
      { to: "/shu", label: "SHU" },
      { to: "/ppatk", label: "PPATK" },
      { to: "/laporan", label: "Laporan" },
      { to: "/pengaturan", label: "Pengaturan" },
    ],
  },
];
