import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; tahun: string; tanggal_mulai?: string; tanggal_selesai?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "tahun", header: "Tahun", sortable: true, cell: (r) => r.tahun },
  { key: "tanggal_mulai", header: "Mulai", cell: (r) => r.tanggal_mulai ?? "—" },
  { key: "tanggal_selesai", header: "Selesai", cell: (r) => r.tanggal_selesai ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function TahunAjaranPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Master Data"
      title="Tahun Ajaran"
      doctype="Tahun Ajaran"
      fields={["name", "tahun", "tanggal_mulai", "tanggal_selesai", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tahun", dir: "desc" }}
      searchFields={["name", "tahun"]}
      addLabel="Tambah TA"
      onAdd={() => alert("Form tahun ajaran (P2)")}
    />
  );
}

export const Route = createFileRoute("/master/tahun-ajaran")({ component: TahunAjaranPage });
