import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { MasterDetailPage, StatusBadge } from "../components/master/MasterDetailPage";
import { ORGANISASI_FIELDS } from "../components/master/schemas";

type Doc = { name: string; nama: string; jenis_organisasi?: string; status?: string };

function OrganisasiDetailPage() {
  const { name } = Route.useParams();
  return (
    <MasterDetailPage<Doc>
      doctype="Organisasi"
      name={name}
      eyebrow="Organisasi"
      parentLabel="Organisasi"
      parentPath="/master/organisasi"
      title={(d) => d.nama || d.name}
      fields={[
        { label: "ID", render: (d) => <span className="font-mono text-xs">{d.name}</span> },
        { label: "Nama", render: (d) => d.nama || "—" },
        { label: "Jenis", render: (d) => <Badge tone="neutral">{d.jenis_organisasi ?? "—"}</Badge> },
        { label: "Status", render: (d) => <StatusBadge status={d.status} /> },
      ]}
      editFields={ORGANISASI_FIELDS}
    />
  );
}

export const Route = createFileRoute("/master/organisasi/$name")({ component: OrganisasiDetailPage });
