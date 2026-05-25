import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = {
  name: string;
  nama_aset: string;
  jenis: string;
  nilai_perolehan: number;
  wakif?: string;
  status: string;
  tanggal_serah_terima: string;
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_aset", header: "Nama Aset", sortable: true, cell: (r) => r.nama_aset },
  { key: "jenis", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis}</Badge> },
  { key: "nilai_perolehan", header: "Nilai", align: "right",
    cell: (r) => <span className="tabular-nums">Rp {r.nilai_perolehan.toLocaleString("id-ID")}</span> },
  { key: "wakif", header: "Wakif", cell: (r) => r.wakif ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Produktif" ? "success" : r.status === "Tidak Produktif" ? "warning" : "neutral"} dot>{r.status}</Badge> },
];

function WakafPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Koperasi"
      title="Aset Wakaf"
      doctype="Aset Wakaf"
      fields={["name", "nama_aset", "jenis", "nilai_perolehan", "wakif", "status", "tanggal_serah_terima"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_serah_terima", dir: "desc" }}
      searchFields={["name", "nama_aset", "wakif"]}
      addLabel="Catat Wakaf"
      onAdd={() => alert("Form aset wakaf (P2)")}
    />
  );
}

export const Route = createFileRoute("/koperasi/wakaf")({ component: WakafPage });
