import { useResourceList } from "@sekolahpro/api-client";
import type { PegawaiApi } from "./roles";

type BerkasRow = { name: string; jenis_berkas?: string; tanggal_unggah?: string };

export function ApiBerkasSection({ pegawai }: { pegawai: PegawaiApi }) {
  const q = useResourceList<BerkasRow>("Berkas Guru", {
    fields: ["name", "jenis_berkas", "tanggal_unggah"],
    filters: { guru: pegawai.name },
    limit_page_length: 100,
  });
  const rows = q.data ?? [];
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Berkas</h2>
      {q.isLoading ? <div className="text-sm text-muted-fg">Memuat...</div> : null}
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-fg">
          <tr><th className="text-left p-1">Nama</th><th className="text-left p-1">Jenis</th><th className="text-left p-1">Diunggah</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-border">
              <td className="p-1">{r.name}</td><td className="p-1">{r.jenis_berkas ?? "—"}</td><td className="p-1">{r.tanggal_unggah ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!q.isLoading && rows.length === 0 ? <div className="text-sm text-muted-fg">Belum ada berkas.</div> : null}
    </section>
  );
}
