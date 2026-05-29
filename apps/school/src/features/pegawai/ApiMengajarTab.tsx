import { useResourceList } from "@sekolahpro/api-client";
import type { PegawaiApi } from "./roles";

type MapelRow = { name: string; mata_pelajaran?: string };

export function ApiMengajarTab({ pegawai }: { pegawai: PegawaiApi }) {
  const q = useResourceList<MapelRow>("Mapel Pengampu Guru", {
    fields: ["name", "mata_pelajaran"],
    filters: { parent: pegawai.name },
    limit_page_length: 100,
  });
  const rows = q.data ?? [];
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Mata Pelajaran Pengampu</h2>
      {q.isLoading ? <div className="text-sm text-muted-fg">Memuat...</div> : null}
      {!q.isLoading && rows.length === 0 ? <div className="text-sm text-muted-fg">Belum ada data.</div> : null}
      <ul className="text-sm">
        {rows.map((r) => <li key={r.name}>{r.mata_pelajaran ?? r.name}</li>)}
      </ul>
    </section>
  );
}
