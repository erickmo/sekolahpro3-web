import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { ORGANISASI_FIELDS } from "../components/master/schemas";

type Row = { name: string; nama: string; jenis_organisasi?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Nama", sortable: true, cell: (r) => r.nama },
  { key: "jenis_organisasi", header: "Jenis", cell: (r) => <Badge tone="neutral">{r.jenis_organisasi ?? "—"}</Badge> },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function OrganisasiPage() {
  return (
    <MasterResourcePage<Row>
      eyebrow="Master Data"
      title="Organisasi"
      doctype="Organisasi"
      fields={["name", "nama", "jenis_organisasi", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama", dir: "asc" }}
      searchFields={["name", "nama"]}
      addLabel="Tambah Organisasi"
      detailRoute="/$sekolah/master/organisasi/$name"
      detailParams={(r) => ({ name: r.name })}
      formTitle="Tambah Organisasi"
      formFields={ORGANISASI_FIELDS}
    />
  );
}

export const Route = createFileRoute("/$sekolah/master/organisasi")({ component: OrganisasiPage });
