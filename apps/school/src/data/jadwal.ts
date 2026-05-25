// Mock data fixture untuk modul Jadwal.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

export type Hari = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
export type StatusJadwal = "Aktif" | "Pengganti" | "Dibatalkan" | "Libur";

export interface Slot {
  id: string;
  hari: Hari;
  jamMulai: string; // HH:mm
  jamSelesai: string; // HH:mm
  mapel: string;
  guru: string;
  guruNip: string;
  kelas: string;
  kodeKelas: string;
  ruang: string;
  status: StatusJadwal;
  catatan?: string | undefined;
}

export const HARI_LIST: Hari[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const JAM_SLOTS: string[] = [
  "07:00",
  "07:45",
  "08:30",
  "09:15",
  "10:00",
  "10:45",
  "11:30",
  "12:15",
  "13:00",
  "13:45",
  "14:30",
];

const KELAS_LIST = [
  "X-IPA-1",
  "X-IPA-2",
  "X-IPS-1",
  "X-IPS-2",
  "XI-IPA-1",
  "XI-IPA-2",
  "XI-IPS-1",
  "XI-IPS-2",
  "XII-IPA-1",
  "XII-IPA-2",
  "XII-IPS-1",
  "XII-IPS-2",
];

const GURU_LIST = [
  "Drs. Suparman",
  "Dra. Hartini",
  "Bambang Sutrisno, S.Pd.",
  "Sri Wahyuni, S.Pd.",
  "Agus Salim, M.Pd.",
  "Lilis Suryani, S.Pd.",
  "Hendra Wijaya, S.Pd.",
  "Yuliana Dewi, S.Pd.",
  "Rahmat Hidayat, S.Pd.",
  "Endang Susilowati, M.Pd.",
];

const MAPEL_LIST = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Fisika",
  "Kimia",
  "Biologi",
  "Sejarah",
  "PKn",
  "Seni Budaya",
  "Penjas",
  "TIK",
  "Ekonomi",
];

const RUANG_LIST = [
  "R-101",
  "R-102",
  "R-103",
  "R-201",
  "R-202",
  "R-203",
  "Lab IPA",
  "Lab Komputer",
  "Lapangan",
  "Aula",
];

const STATUS_LIST: StatusJadwal[] = [
  "Aktif",
  "Aktif",
  "Aktif",
  "Aktif",
  "Aktif",
  "Aktif",
  "Aktif",
  "Aktif",
  "Pengganti",
  "Dibatalkan",
  "Libur",
];

const SLOT_PER_HARI = 8;
const TOTAL_SLOTS = 120;

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.floor(rand(seed) * arr.length)]!;
}

function pad(n: number, w: number) {
  return String(n).padStart(w, "0");
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  const total = h! * 60 + m! + mins;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${pad(nh, 2)}:${pad(nm, 2)}`;
}

function kodeKelasOf(kelas: string): string {
  return kelas.replace(/[^A-Z0-9]/g, "");
}

function buildSlot(idx: number): Slot {
  const hari = HARI_LIST[idx % HARI_LIST.length]!;
  const slotIdx = Math.floor(idx / HARI_LIST.length) % SLOT_PER_HARI;
  const jamMulai = JAM_SLOTS[slotIdx]!;
  const jamSelesai = addMinutes(jamMulai, 45);
  const mapel = pick(MAPEL_LIST, idx + 3);
  const guru = pick(GURU_LIST, idx + 7);
  const guruNip = `1980${pad(idx * 13, 4)}${pad((idx % 12) + 1, 2)}${pad((idx % 27) + 1, 2)}1${pad(idx % 1000, 3)}`;
  const kelas = pick(KELAS_LIST, idx + 11);
  const ruang = pick(RUANG_LIST, idx + 17);
  const status = pick(STATUS_LIST, idx + 19);
  const id = `JDW-${pad(idx + 1, 4)}`;

  const slot: Slot = {
    id,
    hari,
    jamMulai,
    jamSelesai,
    mapel,
    guru,
    guruNip,
    kelas,
    kodeKelas: kodeKelasOf(kelas),
    ruang,
    status,
  };
  if (status === "Pengganti") slot.catatan = "Guru pengganti";
  else if (status === "Dibatalkan") slot.catatan = "Dibatalkan karena rapat dinas";
  else if (status === "Libur") slot.catatan = "Hari libur nasional";
  return slot;
}

export const JADWAL_LIST: Slot[] = Array.from({ length: TOTAL_SLOTS }, (_, i) => buildSlot(i));

export const FILTER_OPTIONS = {
  hari: ["Semua", ...HARI_LIST] as const,
  kelas: ["Semua", ...KELAS_LIST] as const,
  guru: ["Semua", ...GURU_LIST] as const,
  ruang: ["Semua", ...RUANG_LIST] as const,
  status: ["Semua", "Aktif", "Pengganti", "Dibatalkan", "Libur"] as const,
  mapel: ["Semua", ...MAPEL_LIST] as const,
};
