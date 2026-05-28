import { createFileRoute } from "@tanstack/react-router";
import { MasterDetailPage, StatusBadge } from "../components/master/MasterDetailPage";
import { TAHUN_AJARAN_FIELDS } from "../components/master/schemas";

type Doc = { name: string; nama: string; tanggal_mulai?: string; tanggal_selesai?: string; status?: string };

function TahunAjaranDetailPage() {
  const { name } = Route.useParams();
  return (
    <MasterDetailPage<Doc>
      doctype="Tahun Ajaran"
      name={name}
      eyebrow="Tahun Ajaran"
      parentLabel="Tahun Ajaran"
      parentPath="/master/tahun-ajaran"
      title={(d) => d.nama || d.name}
      fields={[
        { label: "ID", render: (d) => <span className="font-mono text-xs">{d.name}</span> },
        { label: "Nama", render: (d) => d.nama || "—" },
        { label: "Tanggal Mulai", render: (d) => d.tanggal_mulai ?? "—" },
        { label: "Tanggal Selesai", render: (d) => d.tanggal_selesai ?? "—" },
        { label: "Status", render: (d) => <StatusBadge status={d.status} /> },
      ]}
      editFields={TAHUN_AJARAN_FIELDS}
    />
  );
}

export const Route = createFileRoute("/master/tahun-ajaran/$name")({ component: TahunAjaranDetailPage });
