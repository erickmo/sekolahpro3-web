import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { MasterDetailPage } from "../components/master/MasterDetailPage";
import { FEATURE_FLAG_FIELDS } from "../components/master/schemas";

type Doc = { name: string; key: string; enabled?: number; description?: string };

function FeatureFlagDetailPage() {
  const { name } = Route.useParams();
  return (
    <MasterDetailPage<Doc>
      doctype="Feature Flag"
      name={name}
      eyebrow="Feature Flag"
      parentLabel="Feature Flag"
      parentPath="/$sekolah/master/feature-flag"
      title={(d) => d.key || d.name}
      fields={[
        { label: "ID", render: (d) => <span className="font-mono text-xs">{d.name}</span> },
        { label: "Key", render: (d) => <span className="font-mono text-xs">{d.key}</span> },
        { label: "Status", render: (d) => <Badge tone={d.enabled ? "success" : "neutral"} dot>{d.enabled ? "On" : "Off"}</Badge> },
        { label: "Deskripsi", render: (d) => d.description ?? "—" },
      ]}
      editFields={FEATURE_FLAG_FIELDS}
    />
  );
}

export const Route = createFileRoute("/$sekolah/master/feature-flag/$name")({ component: FeatureFlagDetailPage });
