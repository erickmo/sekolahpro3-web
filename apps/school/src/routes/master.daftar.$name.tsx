import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { MasterDetailPage, StatusBadge } from "../components/master/MasterDetailPage";
import { SEKOLAH_FIELDS } from "../components/master/schemas";

type Doc = { name: string; nama: string; npsn?: string; alamat?: string; tingkat?: string; status?: string };

function SekolahDetailPage() {
  const { name } = Route.useParams();
  return (
    <MasterDetailPage<Doc>
      doctype="Sekolah"
      name={name}
      eyebrow="Sekolah"
      parentLabel="Sekolah"
      parentPath="/master/daftar"
      title={(d) => d.nama || d.name}
      subtitle={(d) => d.npsn ? `NPSN ${d.npsn}` : ""}
      fields={[
        { label: "ID", render: (d) => <span className="font-mono text-xs">{d.name}</span> },
        { label: "Nama", render: (d) => d.nama || "—" },
        { label: "NPSN", render: (d) => <span className="font-mono text-xs">{d.npsn ?? "—"}</span> },
        { label: "Jenjang", render: (d) => <Badge tone="neutral">{d.tingkat ?? "—"}</Badge> },
        { label: "Alamat", render: (d) => d.alamat ?? "—" },
        { label: "Status", render: (d) => <StatusBadge status={d.status} /> },
      ]}
      editFields={SEKOLAH_FIELDS}
    />
  );
}

export const Route = createFileRoute("/master/daftar/$name")({ component: SekolahDetailPage });
