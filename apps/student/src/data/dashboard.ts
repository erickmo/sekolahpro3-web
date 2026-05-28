// Mock fixtures untuk dashboard siswa.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

export interface JadwalSlot {
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

export interface NilaiEntry {
  subject: string;
  score: number;
  grade: string;
}

export type AgendaTone = "danger" | "warning" | "neutral";
export interface AgendaItem {
  title: string;
  due: string;
  tone: AgendaTone;
}

export interface KehadiranBulanIni {
  hadir: number;
  izin: number;
  alpa: number;
}

export interface ProgresSemester {
  mingguBerjalan: number;
  totalMinggu: number;
  catatan: string;
}

export interface RingkasanStat {
  rataNilai: string;
  deltaNilai: string;
  kehadiran: string;
  deltaKehadiran: string;
  tugasPending: number;
  tugasHint: string;
  ujianMendatang: number;
  ujianHint: string;
}

export const KELAS_SISWA = "XI IPA 2";

export const ringkasanStat: RingkasanStat = {
  rataNilai: "87,5",
  deltaNilai: "+3,2",
  kehadiran: "98%",
  deltaKehadiran: "+1%",
  tugasPending: 3,
  tugasHint: "1 jatuh tempo besok",
  ujianMendatang: 2,
  ujianHint: "minggu ini",
};

export const jadwalHariIni: JadwalSlot[] = [
  { time: "07:30", subject: "Matematika", teacher: "Bu Siti", room: "R. 204" },
  { time: "09:00", subject: "Bahasa Inggris", teacher: "Pak Joko", room: "R. 101" },
  { time: "10:30", subject: "Fisika", teacher: "Pak Andi", room: "Lab Fisika" },
  { time: "13:00", subject: "Sejarah", teacher: "Bu Rina", room: "R. 305" },
];

export const nilaiTerbaru: NilaiEntry[] = [
  { subject: "Matematika", score: 92, grade: "A" },
  { subject: "Bahasa Indonesia", score: 88, grade: "A" },
  { subject: "Fisika", score: 85, grade: "B+" },
  { subject: "Kimia", score: 79, grade: "B" },
  { subject: "Bahasa Inggris", score: 90, grade: "A" },
];

export const agendaMendatang: AgendaItem[] = [
  { title: "Esai Sejarah: Kemerdekaan", due: "Besok", tone: "danger" },
  { title: "PR Matematika Bab 5", due: "2 hari lagi", tone: "warning" },
  { title: "Laporan Praktikum Fisika", due: "5 hari lagi", tone: "neutral" },
];

export const kehadiranBulanIni: KehadiranBulanIni = {
  hadir: 19,
  izin: 1,
  alpa: 0,
};

export const progresSemester: ProgresSemester = {
  mingguBerjalan: 12,
  totalMinggu: 18,
  catatan: "Ujian tengah semester selesai · 6 minggu menuju UAS",
};
