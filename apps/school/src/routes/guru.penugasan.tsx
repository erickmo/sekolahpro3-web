import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; guru: string; jenis_penugasan?: string; tahun_ajaran?: string; status?: string; tanggal_mulai?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "guru", header: "Guru", sortable: true, cell: (r) => r.guru },
  { key: "jenis_penugasan", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_penugasan ?? "—"}</Badge> },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  { key: "tanggal_mulai", header: "Tgl Mulai", sortable: true, cell: (r) => r.tanggal_mulai ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function PenugasanPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Guru"
      title="Penugasan Guru"
      doctype="Penugasan Guru"
      fields={["name", "guru", "jenis_penugasan", "tahun_ajaran", "status", "tanggal_mulai"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_mulai", dir: "desc" }}
      searchFields={["name", "guru"]}
      addLabel="Buat Penugasan"
      onAdd={() => alert("Form penugasan (P2)")}
    />
  );
}

export const Route = createFileRoute("/guru/penugasan")({ component: PenugasanPage });
