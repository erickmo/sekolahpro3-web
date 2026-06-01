/**
 * Modul Aktif master list — live MasterResourcePage with an IT-facing summary.
 *
 * Adds a PageGuide and a "Ringkasan Modul" visualization header (DonutChart +
 * StatCards) above the live CRUD table. The summary reads the same "Modul Aktif"
 * doctype the table edits, so its counts stay in sync.
 *
 * UI strings are Bahasa Indonesia; code/doc comments are English (house rule).
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  type Column,
  SectionCard,
  StatCard,
  IconLayers,
  IconCheck,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { MasterResourcePage } from "../components/master/MasterResourcePage";
import { InlineToggle } from "../components/master/InlineToggle";
import { MODUL_FIELDS } from "../components/master/schemas";
import { PageGuide, type PageGuideStep } from "../components/guide/PageGuide";
import { moduleStats } from "../lib/pengaturanSummary";
import { DonutChart } from "../components/viz/charts";

type Row = { name: string; nama: string; aktif?: number; deskripsi?: string };

/** Upper bound for the summary-only module fetch. */
const LIST_LIMIT = 200;

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama", header: "Modul", sortable: true, cell: (r) => r.nama },
  { key: "aktif", header: "Status",
    cell: (r) => <InlineToggle doctype="Modul Aktif" name={r.name} field="aktif" value={r.aktif} onLabel="Aktif" offLabel="Nonaktif" /> },
  { key: "deskripsi", header: "Deskripsi", cell: (r) => r.deskripsi ?? "—" },
];

/** Steps for the Modul Aktif PageGuide (IT/admin audience). */
const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Aktifkan modul per tenant",
    detail: "Toggle Status untuk menyalakan atau mematikan modul bagi sekolah ini. Perubahan langsung tersimpan ke backend.",
  },
  {
    title: "Pantau adopsi di Ringkasan Modul",
    detail: "Donut dan kartu di atas menampilkan berapa modul aktif vs nonaktif secara real-time.",
  },
  {
    title: "Tambah modul baru",
    detail: 'Gunakan tombol "Tambah Modul" untuk mendaftarkan modul baru, lalu aktifkan saat siap dipakai.',
  },
];

/**
 * Visualization summary header: a DonutChart of active vs inactive modules plus
 * Total / Aktif / Nonaktif StatCards. Reads "Modul Aktif" live.
 *
 * @returns the "Ringkasan Modul" SectionCard.
 */
function ModulSummary() {
  const { data } = useResourceList<Row>("Modul Aktif", { fields: ["name", "aktif"], limit_page_length: LIST_LIMIT });
  const stats = moduleStats(data ?? []);
  const nonaktif = Math.max(0, stats.total - stats.aktif);
  return (
    <SectionCard title="Ringkasan Modul" description={`${stats.pct}% modul aktif`}>
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <DonutChart
          data={[
            { label: "Aktif", value: stats.aktif, tone: "emerald" },
            { label: "Nonaktif", value: nonaktif, tone: "neutral" },
          ]}
          centerTop={`${stats.pct}%`}
          centerBottom="Aktif"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Total Modul" value={stats.total} icon={<IconLayers />} accent="brand" />
          <StatCard label="Aktif" value={stats.aktif} icon={<IconCheck />} accent="emerald" />
          <StatCard label="Nonaktif" value={nonaktif} accent="amber" />
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * The Modul Aktif route: guide + summary header above the live master table.
 *
 * Exported so route-level tests can render it without a full RouterProvider.
 *
 * @returns the page tree.
 */
export function ModulPage() {
  return (
    <div className="space-y-6">
      <PageGuide storageId="pengaturan-modul" storageNamespace="pengaturan-guide:" steps={GUIDE_STEPS} />
      <ModulSummary />
      <MasterResourcePage<Row>
        eyebrow="Pengaturan"
        title="Modul Aktif"
        description="Toggle modul yang dipakai per tenant."
        doctype="Modul Aktif"
        fields={["name", "nama", "aktif", "deskripsi"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama", dir: "asc" }}
        searchFields={["name", "nama"]}
        addLabel="Tambah Modul"
        detailRoute="/sch/$sekolah/pengaturan/modul/$name"
        detailParams={(r) => ({ name: r.name })}
        formTitle="Tambah Modul"
        formFields={MODUL_FIELDS}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/pengaturan/modul")({ component: ModulPage });
