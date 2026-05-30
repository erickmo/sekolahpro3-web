import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { MasterDetailPage, StatusBadge } from "../components/master/MasterDetailPage";
import { PENGGUNA_FIELDS } from "../components/master/schemas";

type Doc = { name: string; user?: string; role_sekolah?: string; sekolah?: string; status?: string };

function PenggunaDetailPage() {
  const { name } = Route.useParams();
  return (
    <MasterDetailPage<Doc>
      doctype="Pengguna Sekolah"
      name={name}
      eyebrow="Pengguna Sekolah"
      parentLabel="Pengguna"
      parentPath="/sch/$sekolah/master/pengguna"
      title={(d) => d.user || d.name}
      subtitle={(d) => d.role_sekolah ?? ""}
      fields={[
        { label: "ID", render: (d) => <span className="font-mono text-xs">{d.name}</span> },
        { label: "User", render: (d) => <span className="font-mono text-xs">{d.user ?? "—"}</span> },
        { label: "Peran", render: (d) => <Badge tone="neutral">{d.role_sekolah ?? "—"}</Badge> },
        { label: "Sekolah", render: (d) => d.sekolah ?? "—" },
        { label: "Status", render: (d) => <StatusBadge status={d.status} /> },
      ]}
      editFields={PENGGUNA_FIELDS}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/master/pengguna/$name")({ component: PenggunaDetailPage });
