// Mock fixtures untuk notifikasi siswa.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

export type NotifikasiTone = "info" | "warning" | "success";

export interface NotifikasiItem {
  id: string;
  title: string;
  body: string;
  ago: string;
  tone: NotifikasiTone;
  read: boolean;
}

export const notifikasiSiswa: NotifikasiItem[] = [
  {
    id: "n1",
    title: "Tugas Sejarah jatuh tempo besok",
    body: "Esai Kemerdekaan — kumpulkan sebelum 23:59.",
    ago: "2 jam lalu",
    tone: "warning",
    read: false,
  },
  {
    id: "n2",
    title: "Nilai Matematika diumumkan",
    body: "Skor: 92 (A). Lihat detail di halaman Nilai.",
    ago: "1 hari lalu",
    tone: "success",
    read: false,
  },
  {
    id: "n3",
    title: "Pengumuman dari Wali Kelas",
    body: "Rapat orang tua hari Sabtu pukul 09:00.",
    ago: "2 hari lalu",
    tone: "info",
    read: true,
  },
];
