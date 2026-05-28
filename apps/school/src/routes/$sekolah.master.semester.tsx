import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { SEMESTER_FIELDS } from "../components/master/schemas";

type Row = { name: string; nama: string; tahun_ajaran?: string; tanggal_mulai?: string; tanggal_selesai?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Semester", sortable: true, cell: (r) => r.nama },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  { key: "tanggal_mulai", header: "Mulai", cell: (r) => r.tanggal_mulai ?? "—" },
  { key: "tanggal_selesai", header: "Selesai", cell: (r) => r.tanggal_selesai ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

function SemesterPage() {
  return (
    <MasterResourcePage<Row>
      eyebrow="Master Data"
      title="Semester"
      doctype="Semester"
      fields={["name", "nama", "tahun_ajaran", "tanggal_mulai", "tanggal_selesai", "status"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "tanggal_mulai", dir: "desc" }}
      searchFields={["name", "nama"]}
      addLabel="Tambah Semester"
      detailRoute="/$sekolah/master/semester/$name"
      detailParams={(r) => ({ name: r.name })}
      formTitle="Tambah Semester"
      formFields={SEMESTER_FIELDS}
    />
  );
}

export const Route = createFileRoute("/$sekolah/master/semester")({ component: SemesterPage });
