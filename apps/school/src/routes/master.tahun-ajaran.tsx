import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { TAHUN_AJARAN_FIELDS } from "../components/master/schemas";

type Row = { name: string; nama: string; tanggal_mulai?: string; tanggal_selesai?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Tahun", sortable: true, cell: (r) => r.nama },
  { key: "tanggal_mulai", header: "Mulai", cell: (r) => r.tanggal_mulai ?? "—" },
  { key: "tanggal_selesai", header: "Selesai", cell: (r) => r.tanggal_selesai ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function TahunAjaranPage() {
  return (
    <MasterResourcePage<Row>
      eyebrow="Master Data"
      title="Tahun Ajaran"
      doctype="Tahun Ajaran"
      fields={["name", "nama", "tanggal_mulai", "tanggal_selesai", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama", dir: "desc" }}
      searchFields={["name", "nama"]}
      addLabel="Tambah TA"
      detailRoute="/master/tahun-ajaran/$name"
      detailParams={(r) => ({ name: r.name })}
      formTitle="Tambah Tahun Ajaran"
      formFields={TAHUN_AJARAN_FIELDS}
    />
  );
}

export const Route = createFileRoute("/master/tahun-ajaran")({ component: TahunAjaranPage });
