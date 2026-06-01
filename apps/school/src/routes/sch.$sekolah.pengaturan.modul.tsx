import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { InlineToggle } from "../components/master/InlineToggle";
import { MODUL_FIELDS } from "../components/master/schemas";

type Row = { name: string; nama: string; aktif?: number; deskripsi?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Modul", sortable: true, cell: (r) => r.nama },
  { key: "aktif", header: "Status",
    cell: (r) => <InlineToggle doctype="Modul Aktif" name={r.name} field="aktif" value={r.aktif} onLabel="Aktif" offLabel="Nonaktif" /> },
  { key: "deskripsi", header: "Deskripsi", cell: (r) => r.deskripsi ?? "—" },
];

function ModulPage() {
  return (
    <MasterResourcePage<Row>
      eyebrow="Pengaturan"
      title="Modul Aktif"
      description="Toggle modul yang dipakai per tenant."
      doctype="Modul Aktif"
      fields={["name", "nama", "aktif", "deskripsi"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "nama", dir: "asc" }}
      searchFields={["name", "nama"]}
      addLabel="Tambah Modul"
      detailRoute="/sch/$sekolah/pengaturan/modul/$name"
      detailParams={(r) => ({ name: r.name })}
      formTitle="Tambah Modul"
      formFields={MODUL_FIELDS}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/pengaturan/modul")({ component: ModulPage });
