import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  periode: string;
  shu_total: number;
  total_partisipasi?: number;
  status?: string;
  tanggal_rat?: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "periode", header: "Periode", sortable: true, cell: (r) => r.periode },
  { key: "shu_total", header: "Total SHU", align: "right",
    cell: (r) => <span className="tabular-nums">Rp {r.shu_total.toLocaleString("id-ID")}</span> },
  { key: "total_partisipasi", header: "Partisipasi", align: "right",
    cell: (r) => r.total_partisipasi !== undefined ? <span className="tabular-nums">Rp {r.total_partisipasi.toLocaleString("id-ID")}</span> : "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Dibagikan" ? "success" : r.status === "Disahkan" ? "brand" : "neutral"} dot>{r.status ?? "—"}</Badge> },
  { key: "tanggal_rat", header: "Tgl RAT", sortable: true, cell: (r) => r.tanggal_rat ?? "—" },
];

function ShuPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Koperasi"
      title="Pembagian SHU"
      description="Sisa Hasil Usaha tahunan setelah RAT."
      doctype="Pembagian SHU"
      fields={["name", "periode", "shu_total"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "periode", dir: "desc" }}
      searchFields={["name", "periode"]}
      extraActions={
        <Button
          variant="outline"
          disabled
          title="Form pembagian SHU dijadwalkan sprint berikutnya."
        >
          Buat Periode SHU
        </Button>
      }
    />
  );
}

export const Route = createFileRoute("/koperasi/shu")({ component: ShuPage });
