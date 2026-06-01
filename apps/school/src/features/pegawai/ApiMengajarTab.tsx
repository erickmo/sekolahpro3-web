import { Badge, EmptyState } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import type { PegawaiApi } from "./roles";

type MapelRow = { name: string; mata_pelajaran?: string; tingkat?: string; linier?: 0 | 1 };
type PenugasanRow = {
  name: string;
  tahun_ajaran?: string;
  semester?: string;
  total_jjm?: number;
  status?: string;
};

export function ApiMengajarTab({ pegawai }: { pegawai: PegawaiApi }) {
  const mapelQ = useResourceList<MapelRow>("Mapel Pengampu Guru", {
    fields: ["name", "mata_pelajaran", "tingkat", "linier"],
    filters: { parent: pegawai.name },
    limit_page_length: 100,
  });
  const penugasanQ = useResourceList<PenugasanRow>("Penugasan Guru", {
    fields: ["name", "tahun_ajaran", "semester", "total_jjm", "status"],
    filters: { guru: pegawai.name },
    order_by: "modified desc",
    limit_page_length: 50,
  });
  const mapel = mapelQ.data ?? [];
  const penugasan = penugasanQ.data ?? [];

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Mata Pelajaran Pengampu</h2>
        {mapelQ.isLoading ? <div className="text-sm text-muted-fg">Memuat...</div> : null}
        {!mapelQ.isLoading && mapel.length === 0 ? (
          <EmptyState
            title="Belum ada mata pelajaran"
            description="Tetapkan mata pelajaran yang diampu guru ini untuk mulai mengelola pengajaran."
          />
        ) : null}
        <ul className="text-sm space-y-1">
          {mapel.map((r) => (
            <li key={r.name} className="flex items-center gap-2">
              <span>{r.mata_pelajaran ?? r.name}</span>
              {r.tingkat ? <Badge tone="neutral">Tingkat {r.tingkat}</Badge> : null}
              {r.linier === 1 ? <Badge tone="success">Linier</Badge> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Penugasan Mengajar</h2>
        {penugasanQ.isLoading ? <div className="text-sm text-muted-fg">Memuat...</div> : null}
        {!penugasanQ.isLoading && penugasan.length === 0 ? (
          <EmptyState
            title="Belum ada penugasan"
            description="Penugasan mengajar per tahun ajaran akan tampil di sini setelah ditetapkan."
          />
        ) : null}
        <table className="w-full text-sm">
          <tbody>
            {penugasan.map((r) => (
              <tr key={r.name} className="border-t border-border">
                <td className="p-1">{r.tahun_ajaran ?? "—"}</td>
                <td className="p-1">{r.semester ?? "—"}</td>
                <td className="p-1">{r.total_jjm ?? 0} JJM</td>
                <td className="p-1"><Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
