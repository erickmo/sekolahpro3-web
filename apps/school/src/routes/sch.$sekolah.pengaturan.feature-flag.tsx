/**
 * Feature Flag master list — live MasterResourcePage with an IT-facing summary.
 *
 * Adds a PageGuide and a "Ringkasan Feature Flag" visualization header
 * (DistributionBar On vs Off + StatCards) above the live CRUD table. The summary
 * reads the same "Feature Flag" doctype the table edits, so its counts stay in
 * sync.
 *
 * UI strings are Bahasa Indonesia; code/doc comments are English (house rule).
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  type Column,
  SectionCard,
  StatCard,
  IconFlag,
  IconCheck,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { InlineToggle } from "../components/master/InlineToggle";
import { FEATURE_FLAG_FIELDS } from "../components/master/schemas";
import { PageGuide, type PageGuideStep } from "../components/guide/PageGuide";
import { flagStats } from "../lib/pengaturanSummary";
import { DistributionBar } from "../components/viz/charts";

type Row = { name: string; key: string; enabled?: number; description?: string };

/** Upper bound for the summary-only feature-flag fetch. */
const LIST_LIMIT = 200;

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "key", header: "Flag", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.key}</span> },
  { key: "enabled", header: "Status",
    cell: (r) => <InlineToggle doctype="Feature Flag" name={r.name} field="enabled" value={r.enabled} onLabel="On" offLabel="Off" /> },
  { key: "description", header: "Deskripsi", cell: (r) => r.description ?? "—" },
];

/** Steps for the Feature Flag PageGuide (IT/admin audience). */
const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Hidupkan / matikan flag",
    detail: "Toggle Status untuk mengaktifkan fitur eksperimental. Perubahan langsung tersimpan ke backend.",
  },
  {
    title: "Pantau flag aktif di Ringkasan",
    detail: "Bar dan kartu di atas menampilkan berapa flag On vs Off secara real-time.",
  },
  {
    title: "Tambah flag baru",
    detail: 'Gunakan tombol "Tambah Flag" untuk mendaftarkan flag baru, lalu hidupkan saat siap diuji.',
  },
];

/**
 * Visualization summary header: a DistributionBar of On vs Off flags plus
 * Total / On / Off StatCards. Reads "Feature Flag" live.
 *
 * @returns the "Ringkasan Feature Flag" SectionCard.
 */
function FeatureFlagSummary() {
  const { data } = useResourceList<Row>("Feature Flag", { fields: ["name", "enabled"], limit_page_length: LIST_LIMIT });
  const stats = flagStats(data ?? []);
  const off = Math.max(0, stats.total - stats.aktif);
  return (
    <SectionCard title="Ringkasan Feature Flag" description={`${stats.pct}% flag aktif`}>
      <DistributionBar
        segments={[
          { label: "On", value: stats.aktif, tone: "brand" },
          { label: "Off", value: off, tone: "neutral" },
        ]}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Flag" value={stats.total} icon={<IconFlag />} accent="brand" />
        <StatCard label="On" value={stats.aktif} icon={<IconCheck />} accent="emerald" />
        <StatCard label="Off" value={off} accent="amber" />
      </div>
    </SectionCard>
  );
}

/**
 * The Feature Flag route: guide + summary header above the live master table.
 *
 * Exported so route-level tests can render it without a full RouterProvider.
 *
 * @returns the page tree.
 */
export function FeatureFlagPage() {
  return (
    <div className="space-y-6">
      <PageGuide storageId="pengaturan-feature-flag" storageNamespace="pengaturan-guide:" steps={GUIDE_STEPS} />
      <FeatureFlagSummary />
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
