import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

// Read-only. Pembuatan/edit Lantai dilakukan lewat modul terkait; di sini hanya
// untuk melihat & menelusuri. Klik baris membuka detail gedung pemiliknya.
type Row = { name: string; gedung?: string; nomor_lantai?: number; nama?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "gedung", header: "Gedung", sortable: true, cell: (r) => r.gedung ?? "—" },
  { key: "nomor_lantai", header: "Nomor", align: "right", cell: (r) => r.nomor_lantai ?? "—" },
  { key: "nama", header: "Nama", cell: (r) => r.nama ?? "—" },
];

function LantaiPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const navigate = useNavigate();
  return (
    <ResourceListPage<Row>
      eyebrow="Infrastruktur"
      title="Lantai"
      description="Read-only. Klik baris untuk membuka detail gedung."
      doctype="Lantai"
      fields={["name", "gedung", "nomor_lantai", "nama"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "gedung", dir: "asc" }}
      searchFields={["name", "gedung"]}
      onRowClick={(r) =>
        r.gedung &&
        navigate({ to: "/$sekolah/infrastruktur/daftar-gedung/$gedungId", params: { sekolah, gedungId: r.gedung } })
      }
    />
  );
}

export const Route = createFileRoute("/$sekolah/infrastruktur/lantai")({ component: LantaiPage });
