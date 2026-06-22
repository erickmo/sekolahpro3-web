// Map domain status strings to @sekolahpro/ui Badge tones.
export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

const CUTI: Record<string, BadgeTone> = {
  Draft: "neutral",
  Diajukan: "warning",
  Disetujui: "success",
  Ditolak: "danger",
  Selesai: "brand",
};

const ABSENSI: Record<string, BadgeTone> = {
  Hadir: "success",
  Izin: "warning",
  Sakit: "warning",
  Alpha: "danger",
  Alpa: "danger",
};

const SK: Record<string, BadgeTone> = {
  Draft: "neutral",
  Diajukan: "warning",
  "Disetujui Kepsek": "success",
  Diterbitkan: "success",
  Dicabut: "danger",
};

export const cutiTone = (s: string): BadgeTone => CUTI[s] ?? "neutral";
export const absensiTone = (s: string): BadgeTone => ABSENSI[s] ?? "neutral";
export const skTone = (s: string): BadgeTone => SK[s] ?? "neutral";
