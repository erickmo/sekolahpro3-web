import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { MasterDetailPage, StatusBadge } from "../components/master/MasterDetailPage";
import { UNIT_JENJANG_FIELDS } from "../components/master/schemas";

type Doc = { name: string; nama: string; tingkat?: string; sekolah?: string; status?: string };

function UnitJenjangDetailPage() {
  const { name } = Route.useParams();
  return (
    <MasterDetailPage<Doc>
      doctype="Unit Jenjang"
      name={name}
      eyebrow="Unit Jenjang"
      parentLabel="Unit Jenjang"
      parentPath="/$sekolah/master/unit-jenjang"
      title={(d) => d.nama || d.name}
      fields={[
        { label: "ID", render: (d) => <span className="font-mono text-xs">{d.name}</span> },
        { label: "Nama", render: (d) => d.nama || "—" },
        { label: "Jenjang", render: (d) => <Badge tone="neutral">{d.tingkat ?? "—"}</Badge> },
        { label: "Sekolah", render: (d) => d.sekolah ?? "—" },
        { label: "Status", render: (d) => <StatusBadge status={d.status} /> },
      ]}
      editFields={UNIT_JENJANG_FIELDS}
    />
  );
}

export const Route = createFileRoute("/$sekolah/master/unit-jenjang/$name")({ component: UnitJenjangDetailPage });
