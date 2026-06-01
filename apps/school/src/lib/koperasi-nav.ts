// Struktur navigasi sidebar khusus shell Koperasi (`/kop/$sekolah`).
//
// Path disimpan sebagai suffix bare (relatif terhadap `/kop/$sekolah`), lalu
// `kopScopedTo` / `kopActivePath` (lihat ./scoped) membentuk target & active
// state. Dipakai oleh root layout untuk merender sidebar koperasi-only —
// terpisah dari menu sekolah.

export interface KoperasiNavItem {
  /** Suffix bare relatif `/kop/$sekolah` (mis. "/daftar", "/" untuk dashboard). */
  to: string;
  label: string;
}

export interface KoperasiNavSection {
  title: string;
  items: KoperasiNavItem[];
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
      { to: "/daftar", label: "Anggota" },
      { to: "/rekening", label: "Rekening" },
    ],
  },
  {
    title: "Operasional",
    items: [
      { to: "/workspace", label: "Workspace" },
      { to: "/transaksi", label: "Transaksi" },
      { to: "/kas-teller", label: "Kas Teller" },
      { to: "/kartu", label: "Kartu RFID" },
      { to: "/emoney", label: "E-Money" },
    ],
  },
  {
    title: "Pembiayaan",
    items: [
      { to: "/pembiayaan", label: "Akad" },
      { to: "/angsuran", label: "Angsuran" },
    ],
  },
  {
    title: "Sosial",
    items: [
      { to: "/zis", label: "ZIS" },
      { to: "/wakaf", label: "Wakaf" },
      { to: "/shu", label: "SHU" },
    ],
  },
  {
    title: "Admin",
    items: [
      { to: "/persetujuan", label: "Persetujuan" },
      { to: "/period-close", label: "Period Close" },
      { to: "/ppatk", label: "PPATK" },
      { to: "/laporan", label: "Laporan" },
      { to: "/pengaturan", label: "Pengaturan" },
    ],
  },
];
