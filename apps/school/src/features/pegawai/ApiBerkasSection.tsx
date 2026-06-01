import { Badge, EmptyState } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import type { PegawaiApi } from "./roles";

type BerkasRow = {
  name: string;
  nama_berkas?: string;
  jenis_berkas?: string;
  nomor_dokumen?: string;
  tanggal_kadaluarsa?: string;
  status_expire?: string;
};

function tone(status?: string): "success" | "warning" | "neutral" {
  if (status === "Aktif") return "success";
  if (status === "Expired") return "warning";
  return "neutral";
}

export function ApiBerkasSection({ pegawai }: { pegawai: PegawaiApi }) {
  const q = useResourceList<BerkasRow>("Berkas Guru", {
    fields: ["name", "nama_berkas", "jenis_berkas", "nomor_dokumen", "tanggal_kadaluarsa", "status_expire"],
    filters: { guru: pegawai.name },
    order_by: "tanggal_kadaluarsa asc",
    limit_page_length: 100,
  });
  const rows = q.data ?? [];
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Berkas</h2>
      {q.isLoading ? <div className="text-sm text-muted-fg">Memuat...</div> : null}
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-fg">
          <tr>
            <th className="text-left p-1">Nama</th>
            <th className="text-left p-1">Jenis</th>
            <th className="text-left p-1">Nomor</th>
            <th className="text-left p-1">Kadaluarsa</th>
            <th className="text-left p-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-border">
              <td className="p-1">{r.nama_berkas ?? r.name}</td>
              <td className="p-1">{r.jenis_berkas ?? "—"}</td>
              <td className="p-1 font-mono text-xs">{r.nomor_dokumen ?? "—"}</td>
              <td className="p-1">{r.tanggal_kadaluarsa ?? "—"}</td>
              <td className="p-1"><Badge tone={tone(r.status_expire)} dot>{r.status_expire ?? "—"}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!q.isLoading && rows.length === 0 ? (
        <EmptyState
          title="Belum ada berkas"
          description="Tambahkan dokumen kepegawaian seperti ijazah, sertifikat, atau SK untuk guru ini."
        />
      ) : null}
    </section>
  );
}
