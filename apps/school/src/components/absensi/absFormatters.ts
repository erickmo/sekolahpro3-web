export function absFormatDate(v: string | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function absFormatTime(v: string | undefined): string {
  if (!v) return "—";
  // Frappe time may come as "HH:MM:SS" or full datetime.
  if (/^\d{2}:\d{2}/.test(v)) return v.slice(0, 5);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export const ABS_STATUS_OPTIONS = [
  { value: "H", label: "Hadir" },
  { value: "I", label: "Izin" },
  { value: "S", label: "Sakit" },
  { value: "A", label: "Alpa" },
];

export const ABS_STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "brand"> = {
  H: "success",
  Hadir: "success",
  I: "warning",
  Izin: "warning",
  S: "warning",
  Sakit: "warning",
  A: "danger",
  Alpa: "danger",
  Dinas: "brand",
  Final: "success",
  Draft: "warning",
};
