import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { SEKOLAH_FIELDS } from "../components/master/schemas";

type Row = { name: string; nama: string; npsn?: string; alamat?: string; tingkat?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama Sekolah", sortable: true, cell: (r) => r.nama },
  { key: "npsn", header: "NPSN", cell: (r) => <span className="font-mono text-xs">{r.npsn ?? "—"}</span> },
  { key: "tingkat", header: "Jenjang", cell: (r) => <Badge tone="neutral">{r.tingkat ?? "—"}</Badge> },
  { key: "alamat", header: "Alamat", cell: (r) => r.alamat ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function SekolahPage() {
  return (
    <MasterResourcePage<Row>
      eyebrow="Master Data"
      title="Sekolah"
      doctype="Sekolah"
      fields={["name", "nama", "npsn", "alamat", "tingkat", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama", dir: "asc" }}
      searchFields={["name", "nama", "npsn"]}
      addLabel="Tambah Sekolah"
      detailRoute="/$sekolah/master/daftar/$name"
      detailParams={(r) => ({ name: r.name })}
      formTitle="Tambah Sekolah"
      formFields={SEKOLAH_FIELDS}
    />
  );
}

export const Route = createFileRoute("/$sekolah/master/daftar")({ component: SekolahPage });
