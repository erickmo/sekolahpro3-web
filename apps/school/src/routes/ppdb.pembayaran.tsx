import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; pendaftaran_ppdb?: string; calon_siswa?: string; total?: number; metode?: string; status?: string; tanggal_bayar?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No. Bayar", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "calon_siswa", header: "Calon Siswa", cell: (r) => r.calon_siswa ?? "—" },
  { key: "total", header: "Total", align: "right", sortable: true,
    cell: (r) => <span className="tabular-nums">Rp {(r.total ?? 0).toLocaleString("id-ID")}</span> },
  { key: "metode", header: "Metode", cell: (r) => <Badge tone="neutral">{r.metode ?? "—"}</Badge> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Lunas" ? "success" : r.status === "Belum Lunas" ? "warning" : r.status === "Gagal" ? "danger" : "neutral"} dot>{r.status ?? "—"}</Badge> },
  { key: "tanggal_bayar", header: "Tgl Bayar", sortable: true, cell: (r) => r.tanggal_bayar ?? "—" },
];

function PembayaranPpdbPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="PPDB"
      title="Pembayaran PPDB"
      doctype="Pembayaran PPDB"
      fields={["name", "pendaftaran_ppdb", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "desc" }}
      searchFields={["name"]}
      selectFilters={[
        { key: "status", label: "Status", field: "status",
          options: ["Semua", "Belum Lunas", "Lunas", "Gagal", "Refund"].map((v) => ({ value: v, label: v })) },
      ]}
      addLabel="Catat Pembayaran"
      onAdd={() => alert("Form pembayaran PPDB (P2)")}
    />
  );
}

export const Route = createFileRoute("/ppdb/pembayaran")({ component: PembayaranPpdbPage });
