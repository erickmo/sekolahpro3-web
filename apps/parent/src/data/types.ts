export interface ChildSummary {
  nis: string;
  nama: string;
  kelas: string;
  sekolahId: string;
  avatarUrl: string | null;
}

export interface ChildDashboard {
  rerataNilai: string;
  kehadiranPct: string;
  tugasPending: number;
  infoTerkini: Array<{ id: string; title: string; body: string; ago: string }>;
}

export interface JadwalItem {
  id: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  mapel: string;
  guru: string;
  ruang: string;
}

export interface NilaiItem {
  id: string;
  mapel: string;
  semester: string;
  nilaiAngka: number;
  nilaiHuruf: string;
  catatan: string | null;
}

export interface AbsensiItem {
  id: string;
  tanggal: string;
  status: "hadir" | "izin" | "sakit" | "alpa";
  catatan: string | null;
}

export interface PesanItem {
  id: string;
  nis: string | null;
  pengirim: string;
  judul: string;
  isi: string;
  dikirim: string;
  dibaca: boolean;
}

export interface TagihanItem {
  id: string;
  nis: string;
  judul: string;
  jumlah: number;
  jatuhTempo: string;
  status: "lunas" | "belum_lunas" | "terlambat";
}

export interface TagihanDetail extends TagihanItem {
  rincian: Array<{ label: string; jumlah: number }>;
  metodePembayaran: string[];
  catatan: string | null;
}
