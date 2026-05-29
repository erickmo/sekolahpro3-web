import type {
  ChildSummary, ChildDashboard, JadwalItem, NilaiItem,
  AbsensiItem, PesanItem, TagihanItem, TagihanDetail,
} from "../types";

const childA: ChildSummary = { nis: "1001", nama: "Andi Pratama", kelas: "XI IPA 2", sekolahId: "SMK01", avatarUrl: null };
const childB: ChildSummary = { nis: "1002", nama: "Bunga Pratami", kelas: "VIII B", sekolahId: "SMK01", avatarUrl: null };

export const mockChildren: ChildSummary[] = [childA, childB];

export const mockDashboard: Record<string, ChildDashboard> = {
  "1001": {
    rerataNilai: "87,5", kehadiranPct: "98%", tugasPending: 3,
    infoTerkini: [
      { id: "i1", title: "Nilai Matematika diumumkan", body: "Skor 92 (A)", ago: "1 hari lalu" },
    ],
  },
  "1002": {
    rerataNilai: "82,1", kehadiranPct: "95%", tugasPending: 1,
    infoTerkini: [
      { id: "i2", title: "Rapat orang tua", body: "Sabtu 09:00", ago: "2 hari lalu" },
    ],
  },
};

export const mockJadwal: Record<string, JadwalItem[]> = {
  "1001": [
    { id: "j1", hari: "Senin", jamMulai: "07:30", jamSelesai: "09:00", mapel: "Matematika", guru: "Bu Siti", ruang: "R. 204" },
    { id: "j2", hari: "Senin", jamMulai: "09:00", jamSelesai: "10:30", mapel: "Fisika", guru: "Pak Andi", ruang: "Lab Fisika" },
  ],
  "1002": [
    { id: "j3", hari: "Senin", jamMulai: "07:30", jamSelesai: "09:00", mapel: "IPA", guru: "Bu Rina", ruang: "R. 101" },
  ],
};

export const mockNilai: Record<string, NilaiItem[]> = {
  "1001": [
    { id: "n1", mapel: "Matematika", semester: "Ganjil 2025/2026", nilaiAngka: 92, nilaiHuruf: "A", catatan: null },
    { id: "n2", mapel: "Fisika", semester: "Ganjil 2025/2026", nilaiAngka: 85, nilaiHuruf: "B+", catatan: null },
  ],
  "1002": [
    { id: "n3", mapel: "IPA", semester: "Ganjil 2025/2026", nilaiAngka: 80, nilaiHuruf: "B+", catatan: null },
  ],
};

export const mockAbsensi: Record<string, AbsensiItem[]> = {
  "1001": [
    { id: "a1", tanggal: "2026-05-26", status: "hadir", catatan: null },
    { id: "a2", tanggal: "2026-05-27", status: "izin", catatan: "Acara keluarga" },
  ],
  "1002": [
    { id: "a3", tanggal: "2026-05-26", status: "hadir", catatan: null },
  ],
};

export const mockPesan: PesanItem[] = [
  { id: "p1", nis: "1001", pengirim: "Wali Kelas XI IPA 2", judul: "Pengumuman rapat orang tua", isi: "Sabtu pukul 09:00 di aula.", dikirim: "2026-05-27", dibaca: false },
  { id: "p2", nis: "1002", pengirim: "Tata Usaha", judul: "Tagihan SPP Mei", isi: "Mohon dilunasi sebelum tanggal 30.", dikirim: "2026-05-26", dibaca: true },
  { id: "p3", nis: null, pengirim: "Kepala Sekolah", judul: "Libur nasional", isi: "Senin libur — Hari Raya.", dikirim: "2026-05-25", dibaca: true },
];

const tagihan1: TagihanItem = { id: "t1", nis: "1001", judul: "SPP Mei 2026", jumlah: 750000, jatuhTempo: "2026-05-30", status: "belum_lunas" };
const tagihan2: TagihanItem = { id: "t2", nis: "1002", judul: "SPP Mei 2026", jumlah: 600000, jatuhTempo: "2026-05-30", status: "lunas" };

export const mockTagihan: TagihanItem[] = [tagihan1, tagihan2];

export const mockTagihanDetail: Record<string, TagihanDetail> = {
  t1: {
    ...tagihan1,
    rincian: [
      { label: "SPP bulanan", jumlah: 700000 },
      { label: "Ekstrakurikuler", jumlah: 50000 },
    ],
    metodePembayaran: ["Transfer Bank", "Virtual Account"],
    catatan: null,
  },
  t2: {
    ...tagihan2,
    rincian: [{ label: "SPP bulanan", jumlah: 600000 }],
    metodePembayaran: ["Transfer Bank"],
    catatan: "Sudah lunas via VA.",
  },
};
