import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; nama: string; user?: string; peran?: string; sekolah?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama", sortable: true, cell: (r) => r.nama },
  { key: "user", header: "User", cell: (r) => <span className="font-mono text-xs">{r.user ?? "—"}</span> },
  { key: "peran", header: "Peran", cell: (r) => <Badge tone="neutral">{r.peran ?? "—"}</Badge> },
  { key: "sekolah", header: "Sekolah", cell: (r) => r.sekolah ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function PenggunaPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Master Data"
      title="Pengguna Sekolah"
      doctype="Pengguna Sekolah"
      fields={["name", "nama", "user", "peran", "sekolah", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama", dir: "asc" }}
      searchFields={["name", "nama", "user"]}
      addLabel="Undang Pengguna"
      onAdd={() => alert("Form pengguna (P2)")}
    />
  );
}

export const Route = createFileRoute("/master/pengguna")({ component: PenggunaPage });
