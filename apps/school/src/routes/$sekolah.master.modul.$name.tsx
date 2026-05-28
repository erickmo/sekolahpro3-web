import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { MasterDetailPage } from "../components/master/MasterDetailPage";
import { MODUL_FIELDS } from "../components/master/schemas";

type Doc = { name: string; nama: string; aktif?: number; deskripsi?: string };

function ModulDetailPage() {
  const { name } = Route.useParams();
  return (
    <MasterDetailPage<Doc>
      doctype="Modul Aktif"
      name={name}
      eyebrow="Modul Aktif"
      parentLabel="Modul Aktif"
      parentPath="/master/modul"
      title={(d) => d.nama || d.name}
      fields={[
        { label: "ID", render: (d) => <span className="font-mono text-xs">{d.name}</span> },
        { label: "Nama", render: (d) => d.nama || "—" },
        { label: "Status", render: (d) => <Badge tone={d.aktif ? "success" : "neutral"} dot>{d.aktif ? "Aktif" : "Nonaktif"}</Badge> },
        { label: "Deskripsi", render: (d) => d.deskripsi ?? "—" },
      ]}
      editFields={MODUL_FIELDS}
    />
  );
}

export const Route = createFileRoute("/master/modul/$name")({ component: ModulDetailPage });
