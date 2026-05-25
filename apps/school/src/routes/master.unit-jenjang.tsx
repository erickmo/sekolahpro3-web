import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama: string; jenjang?: string; sekolah?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama Unit", sortable: true, cell: (r) => r.nama },
  { key: "jenjang", header: "Jenjang", cell: (r) => <Badge tone="neutral">{r.jenjang ?? "—"}</Badge> },
  { key: "sekolah", header: "Sekolah", cell: (r) => r.sekolah ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function UnitJenjangPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Master Data"
      title="Unit Jenjang"
      doctype="Unit Jenjang"
      fields={["name", "nama", "jenjang", "sekolah", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama", dir: "asc" }}
      searchFields={["name", "nama"]}
      addLabel="Tambah Unit"
      onAdd={() => alert("Form unit jenjang (P2)")}
    />
  );
}

export const Route = createFileRoute("/master/unit-jenjang")({ component: UnitJenjangPage });
