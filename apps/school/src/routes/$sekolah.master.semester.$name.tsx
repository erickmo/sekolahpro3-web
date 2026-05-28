import { createFileRoute } from "@tanstack/react-router";
import { MasterDetailPage, StatusBadge } from "../components/master/MasterDetailPage";
import { SEMESTER_FIELDS } from "../components/master/schemas";

type Doc = { name: string; nama: string; tahun_ajaran?: string; tanggal_mulai?: string; tanggal_selesai?: string; status?: string };

function SemesterDetailPage() {
  const { name } = Route.useParams();
  return (
    <MasterDetailPage<Doc>
      doctype="Semester"
      name={name}
      eyebrow="Semester"
      parentLabel="Semester"
      parentPath="/$sekolah/master/semester"
      title={(d) => d.nama || d.name}
      subtitle={(d) => d.tahun_ajaran ?? ""}
      fields={[
        { label: "ID", render: (d) => <span className="font-mono text-xs">{d.name}</span> },
        { label: "Nama", render: (d) => d.nama || "—" },
        { label: "Tahun Ajaran", render: (d) => d.tahun_ajaran ?? "—" },
        { label: "Tanggal Mulai", render: (d) => d.tanggal_mulai ?? "—" },
        { label: "Tanggal Selesai", render: (d) => d.tanggal_selesai ?? "—" },
        { label: "Status", render: (d) => <StatusBadge status={d.status} /> },
      ]}
      editFields={SEMESTER_FIELDS}
    />
  );
}

export const Route = createFileRoute("/$sekolah/master/semester/$name")({ component: SemesterDetailPage });
