// Pure helpers untuk meresolusi & memvalidasi periode Akademik (Tahun Ajaran +
// Semester). Tanpa akses DB/session/React — gampang di-test, dipakai oleh layout
// Akademik dan AkademikContextBar (≥2 pemakai → modul terpisah dibenarkan).

export type SemesterValue = "Ganjil" | "Genap";

export interface TahunAjaranRow {
  name: string;
  nama?: string;
  is_current?: 0 | 1;
  status?: string; // "Draft" | "Aktif" | "Closed"
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  semester_ganjil_mulai?: string;
  semester_ganjil_akhir?: string;
  semester_genap_mulai?: string;
  semester_genap_akhir?: string;
}

const STATUS_AKTIF = "Aktif";
const STATUS_CLOSED = "Closed";

function inWindow(ref: Date, start?: string, end?: string): boolean {
  if (!start || !end) return false;
  const t = ref.getTime();
  return t >= new Date(start).getTime() && t <= new Date(end).getTime();
}

// TA "terbaru" = tanggal_mulai terbesar; fallback urutan nama desc bila tanggal kosong.
function newest(list: TahunAjaranRow[]): TahunAjaranRow | undefined {
  return [...list].sort((a, b) => {
    const am = a.tanggal_mulai ?? "";
    const bm = b.tanggal_mulai ?? "";
    if (am !== bm) return am < bm ? 1 : -1;
    return (a.nama ?? a.name) < (b.nama ?? b.name) ? 1 : -1;
  })[0];
}

export interface ResolveTaInput {
  urlTa?: string;
  storedTa?: string;
  refDate: Date;
}

export interface ResolveTaResult {
  ta: string;
  noActiveTa?: boolean;
}

// Chain (berhenti di match pertama): URL → localStorage → is_current →
// status Aktif & ref dalam window → TA terbaru (tandai noActiveTa).
export function resolveTahunAjaran(
  list: TahunAjaranRow[],
  { urlTa, storedTa, refDate }: ResolveTaInput,
): ResolveTaResult {
  const has = (name?: string) => !!name && list.some((t) => t.name === name);
  if (has(urlTa)) return { ta: urlTa! };
  if (has(storedTa)) return { ta: storedTa! };

  const current = list.find((t) => t.is_current === 1);
  if (current) return { ta: current.name };

  const aktif = list.find(
    (t) => t.status === STATUS_AKTIF && inWindow(refDate, t.tanggal_mulai, t.tanggal_selesai),
  );
  if (aktif) return { ta: aktif.name };

  const latest = newest(list);
  if (latest) return { ta: latest.name, noActiveTa: true };
  return { ta: "", noActiveTa: true };
}

export interface ComputeSemesterInput {
  urlSemester?: string;
  storedSemester?: string;
  refDate: Date;
}

function monthFallback(ref: Date): SemesterValue {
  // Jul–Des (bulan 6–11) → Ganjil; Jan–Jun → Genap.
  return ref.getMonth() >= 6 ? "Ganjil" : "Genap";
}

// Semester: URL → localStorage → window tanggal TA → fallback bulan.
export function computeSemester(
  ta: TahunAjaranRow | undefined,
  { urlSemester, storedSemester, refDate }: ComputeSemesterInput,
): SemesterValue {
  if (urlSemester === "Ganjil" || urlSemester === "Genap") return urlSemester;
  if (storedSemester === "Ganjil" || storedSemester === "Genap") return storedSemester;
  if (ta) {
    if (inWindow(refDate, ta.semester_ganjil_mulai, ta.semester_ganjil_akhir)) return "Ganjil";
    if (inWindow(refDate, ta.semester_genap_mulai, ta.semester_genap_akhir)) return "Genap";
  }
  return monthFallback(refDate);
}

// Periode "lampau/ditutup": status Closed ATAU ref di luar window TA.
export function isPastPeriod(ta: TahunAjaranRow | undefined, refDate: Date): boolean {
  if (!ta) return false;
  if (ta.status === STATUS_CLOSED) return true;
  if (ta.tanggal_mulai && ta.tanggal_selesai) {
    return !inWindow(refDate, ta.tanggal_mulai, ta.tanggal_selesai);
  }
  return false;
}

export interface StoredPeriode {
  ta?: string;
  semester?: string;
}

function storageKey(sekolah: string): string {
  return `akademik:periode:${sekolah}`;
}

// localStorage tak tersedia/korup → kembalikan {} (jangan throw).
export function readStoredPeriode(sekolah: string): StoredPeriode {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey(sekolah));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredPeriode;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeStoredPeriode(sekolah: string, value: StoredPeriode): void {
  try {
    globalThis.localStorage?.setItem(storageKey(sekolah), JSON.stringify(value));
  } catch {
    /* ignore quota/unavailable */
  }
}
