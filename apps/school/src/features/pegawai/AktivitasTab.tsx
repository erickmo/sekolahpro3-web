import type { Pegawai } from "../../data/pegawai";

const TONE_CLASS: Record<"neutral" | "brand" | "success" | "warning" | "danger", string> = {
  neutral: "bg-muted-fg",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function AktivitasTab({ pegawai }: { pegawai: Pegawai }) {
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Aktivitas Terbaru</h2>
      <ul className="space-y-2 text-sm">
        {pegawai.aktivitas.map((a, i) => (
          <li key={i} className="flex gap-2">
            <span className={`mt-1 inline-block h-2 w-2 rounded-full ${TONE_CLASS[a.tone]}`} />
            <div className="flex-1">
              <div className="text-fg">{a.aktor} <span className="text-muted-fg">{a.aksi}</span></div>
              <div className="text-xs text-muted-fg">{a.waktu}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
