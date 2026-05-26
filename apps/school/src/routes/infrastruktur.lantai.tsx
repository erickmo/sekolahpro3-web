import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; gedung?: string; nomor_lantai?: number; nama?: string; nama_lantai?: string; jumlah_ruangan?: number };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "gedung", header: "Gedung", sortable: true, cell: (r) => r.gedung ?? "—" },
  { key: "nomor_lantai", header: "Nomor", align: "right", cell: (r) => r.nomor_lantai ?? "—" },
  { key: "nama", header: "Nama", cell: (r) => r.nama ?? "—" },
  { key: "jumlah_ruangan", header: "Ruangan", align: "right", cell: (r) => r.jumlah_ruangan ?? "—" },
];

function LantaiPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Infrastruktur"
      title="Lantai"
      doctype="Lantai"
      fields={["name", "gedung", "nomor_lantai", "nama"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "gedung", dir: "asc" }}
      searchFields={["name", "gedung"]}
      addLabel="Tambah Lantai"
      onAdd={() => alert("Form lantai (P2)")}
    />
  );
}

export const Route = createFileRoute("/infrastruktur/lantai")({ component: LantaiPage });
