import { useMemo } from "react";
import { Badge, EmptyState } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import type { PegawaiApi } from "./roles";

// `Detail Absensi Guru` is a child table; `tanggal` lives on the parent
// `Absensi Guru`. The REST list endpoint can't join the parent date, so we
// surface a status rekap + the parent rapor ref instead of a dated timeline.
type AbsensiRow = { name: string; parent?: string; status?: string; keterangan?: string };

const STATUSES = ["Hadir", "Izin", "Sakit", "Alpha"] as const;
const RECENT_LIMIT = 30;

function tone(status?: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "Hadir") return "success";
  if (status === "Izin" || status === "Sakit") return "warning";
  if (status === "Alpha") return "danger";
  return "neutral";
}

export function ApiKehadiranSection({ pegawai }: { pegawai: PegawaiApi }) {
  const q = useResourceList<AbsensiRow>("Detail Absensi Guru", {
    fields: ["name", "parent", "status", "keterangan"],
    filters: { guru: pegawai.name },
    order_by: "creation desc",
    limit_page_length: RECENT_LIMIT,
  });
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const rekap = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.status ?? "—"] = (counts[r.status ?? "—"] ?? 0) + 1;
    return counts;
  }, [rows]);

  return (
    <section className="rounded-lg border border-border bg-bg p-4 space-y-3">
      <h2 className="text-sm font-semibold text-fg">Kehadiran ({RECENT_LIMIT} terakhir)</h2>
      {q.isLoading ? <div className="text-sm text-muted-fg">Memuat...</div> : null}

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Badge key={s} tone={tone(s)} dot>{s}: {rekap[s] ?? 0}</Badge>
        ))}
      </div>

      <table className="w-full text-sm">
        <thead className="text-xs text-muted-fg">
          <tr>
            <th className="text-left p-1">Rekap Absensi</th>
            <th className="text-left p-1">Status</th>
            <th className="text-left p-1">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-border">
              <td className="p-1 font-mono text-xs">{r.parent ?? "—"}</td>
              <td className="p-1"><Badge tone={tone(r.status)} dot>{r.status ?? "—"}</Badge></td>
              <td className="p-1">{r.keterangan ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!q.isLoading && rows.length === 0 ? (
        <EmptyState
          title="Belum ada catatan kehadiran"
          description="Rekap absensi guru akan muncul di sini setelah data kehadiran diinput."
        />
      ) : null}
    </section>
  );
}
