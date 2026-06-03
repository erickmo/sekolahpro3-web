import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { InlineToggle } from "../components/master/InlineToggle";
import { FEATURE_FLAG_FIELDS } from "../components/master/schemas";
import { PageGuide } from "../components/guide";
import { PENGATURAN_PAGE_GUIDES } from "../components/pengaturan/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

type Row = { name: string; key: string; enabled?: number; description?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "key", header: "Flag", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.key}</span> },
  { key: "enabled", header: "Status",
    cell: (r) => <InlineToggle doctype="Feature Flag" name={r.name} field="enabled" value={r.enabled} onLabel="On" offLabel="Off" /> },
  { key: "description", header: "Deskripsi", cell: (r) => r.description ?? "—" },
];

function FeatureFlagPage() {
  return (
    <div className="space-y-6">
      <PageGuide
        storageNamespace="pengaturan-guide:"
        storageId="feature-flag"
        title={PENGATURAN_PAGE_GUIDES["feature-flag"].title}
        intro={PENGATURAN_PAGE_GUIDES["feature-flag"].intro}
        steps={PENGATURAN_PAGE_GUIDES["feature-flag"].steps}
        tips={PENGATURAN_PAGE_GUIDES["feature-flag"].tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />
      <MasterResourcePage<Row>
      eyebrow="Pengaturan"
      title="Feature Flag"
      doctype="Feature Flag"
      fields={["name", "key", "enabled", "description"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "key", dir: "asc" }}
      searchFields={["name", "key"]}
      addLabel="Tambah Flag"
      detailRoute="/sch/$sekolah/pengaturan/feature-flag/$name"
      detailParams={(r) => ({ name: r.name })}
      formTitle="Tambah Feature Flag"
      formFields={FEATURE_FLAG_FIELDS}
    />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/pengaturan/feature-flag")({ component: FeatureFlagPage });
