import { useResourceList } from "@sekolahpro/api-client";
import type { PegawaiApi } from "./roles";

type AbsensiRow = { name: string; tanggal?: string; status_kehadiran?: string };

export function ApiKehadiranSection({ pegawai }: { pegawai: PegawaiApi }) {
  const q = useResourceList<AbsensiRow>("Detail Absensi Guru", {
    fields: ["name", "tanggal", "status_kehadiran"],
    filters: { guru: pegawai.name },
    order_by: "tanggal desc",
    limit_page_length: 30,
  });
  const rows = q.data ?? [];
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Kehadiran (30 terakhir)</h2>
      {q.isLoading ? <div className="text-sm text-muted-fg">Memuat...</div> : null}
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-fg">
          <tr><th className="text-left p-1">Tanggal</th><th className="text-left p-1">Status</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-border">
              <td className="p-1">{r.tanggal ?? "—"}</td><td className="p-1">{r.status_kehadiran ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!q.isLoading && rows.length === 0 ? <div className="text-sm text-muted-fg">Belum ada catatan kehadiran.</div> : null}
    </section>
  );
}
