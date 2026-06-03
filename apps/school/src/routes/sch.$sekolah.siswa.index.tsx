import type { ReactNode } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  AttentionList,
  Badge,
  GettingStartedCard,
  GlossaryTooltip,
  ModuleFlow,
  PageHeader,
  SectionCard,
  StatCard,
  IconUsers,
  IconCheck,
  IconGrad,
  IconBook,
  IconFile,
  IconPlus,
  type ModuleFlowStep,
  type AttentionItem,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { DonutChart, DistributionBar, HBarChart } from "../components/viz";
import type { ChartDatum, DistributionSegment } from "../components/viz/charts";
import {
  computeSiswaStats,
  statusDonut,
  genderSegments,
  deriveActionQueue,
  type SiswaRow,
  type SiswaStats,
} from "../lib/orang/siswaStats";
import { glossaryFor } from "../lib/orang/glossary";
import { PageGuide } from "../components/guide";
import { SISWA_PAGE_GUIDES } from "../components/siswa/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

// Only fields confirmed in sch.$sekolah.siswa.daftar.tsx are requested here.
const SISWA_FIELDS = ["name", "nama_lengkap", "jenis_kelamin", "jenjang", "status"];
// Fetch every row (no server-side pagination) so the aggregation is complete.
const FETCH_ALL = 0;
// Cap the action queue shown on the dashboard.
const ACTION_QUEUE_LIMIT = 6;

/** A renderLink lets the pure View stay router-free for testing. */
type RenderLink = (href: string, children: ReactNode, className?: string) => ReactNode;

/** Guided onboarding steps for building the Siswa directory from scratch. */
const SISWA_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "rombel", label: "Rombel", hint: "Susun rombongan belajar", href: "/sch/$sekolah/siswa/rombel" },
  { key: "pendaftaran", label: "Pendaftaran", hint: "Terima calon siswa baru", href: "/sch/$sekolah/siswa/pendaftaran" },
  { key: "wali", label: "Data Wali", hint: "Daftarkan wali siswa", href: "/sch/$sekolah/siswa/wali" },
  { key: "mutasi", label: "Mutasi", hint: "Pindah masuk/keluar", href: "/sch/$sekolah/siswa/mutasi" },
  { key: "kelulusan", label: "Kelulusan", hint: "Proses calon lulus", href: "/sch/$sekolah/siswa/kelulusan" },
];

/** Quick-action shortcuts to the most-used Siswa workflows. */
const QUICK_ACTIONS: { to: string; label: string; description: string; icon: ReactNode }[] = [
  { to: "/sch/$sekolah/siswa/daftar", label: "Daftar Siswa", description: "Lihat, cari, dan ekspor data siswa.", icon: <IconUsers /> },
  { to: "/sch/$sekolah/siswa/pendaftaran", label: "Pendaftaran", description: "Terima dan verifikasi calon siswa.", icon: <IconPlus /> },
  { to: "/sch/$sekolah/siswa/mutasi", label: "Catat Mutasi", description: "Pindah masuk, keluar, atau naik kelas.", icon: <IconFile /> },
  { to: "/sch/$sekolah/siswa/kelulusan", label: "Proses Kelulusan", description: "Kelola data calon lulusan.", icon: <IconGrad /> },
  { to: "/sch/$sekolah/siswa/rombel", label: "Atur Rombel", description: "Susun anggota rombongan belajar.", icon: <IconBook /> },
];

/** Props for the pure presentational dashboard (no hooks, no fetching). */
export interface SiswaDashboardViewProps {
  sekolah: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string | undefined;
  total: number;
  stats: SiswaStats;
  statusData: ChartDatum[];
  genderData: DistributionSegment[];
  actionItems: AttentionItem[];
  renderLink: RenderLink;
}

/** A glossary term rendered as a tooltip; empty definition is harmless. */
function Term({ term }: { term: string }): ReactNode {
  return <GlossaryTooltip term={term} definition={glossaryFor(term) ?? ""} />;
}

/** The four headline KPI cards, all derived from real counts. */
function KpiRow({ stats, isLoading }: { stats: SiswaStats; isLoading: boolean }): ReactNode {
  const show = (n: number): string => (isLoading ? "…" : n.toLocaleString("id-ID"));
  const calon = stats.byStatus["Calon"] ?? 0;
  const pindah = stats.byStatus["Pindah Keluar"] ?? 0;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Siswa" value={show(stats.total)} hint="seluruh status" icon={<IconUsers />} accent="brand" />
      <StatCard label="Siswa Aktif" value={show(stats.aktif)} hint={`dari ${stats.total} total`} icon={<IconCheck />} accent="emerald" />
      <StatCard label="Calon Siswa" value={show(calon)} hint="menunggu aktivasi" icon={<IconPlus />} accent="amber" urgency={calon > 0 ? "warn" : "normal"} />
      <StatCard label="Mutasi Keluar" value={show(pindah)} hint="perlu difinalisasi" icon={<IconFile />} accent="rose" urgency={pindah > 0 ? "warn" : "normal"} />
    </div>
  );
}

/** The status donut + gender distribution + jenjang bars row. */
function ChartsRow({ stats, statusData, genderData }: {
  stats: SiswaStats;
  statusData: ChartDatum[];
  genderData: DistributionSegment[];
}): ReactNode {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SectionCard title="Sebaran Status" description="Komposisi siswa per status pendataan.">
        <DonutChart data={statusData} centerTop={stats.total} centerBottom="siswa" />
      </SectionCard>
      <SectionCard title="Komposisi Gender" description="Proporsi siswa laki-laki dan perempuan.">
        <DistributionBar segments={genderData} />
      </SectionCard>
      <SectionCard
        title={<>Sebaran per <Term term="Rombel" />/Jenjang</>}
        description="Jumlah siswa pada tiap jenjang."
      >
        <HBarChart data={stats.byJenjang} />
      </SectionCard>
    </div>
  );
}

/** The "Aksi Cepat" shortcut grid. */
function QuickActions({ renderLink }: { renderLink: RenderLink }): ReactNode {
  return (
    <SectionCard title="Aksi Cepat" description="Pintasan ke alur kerja kesiswaan yang sering digunakan.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((a) =>
          renderLink(
            a.to,
            <span className="group flex items-start gap-3 rounded-lg border border-border bg-bg p-3 transition-colors hover:border-brand hover:bg-muted/30">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-fg group-hover:bg-brand/10 group-hover:text-brand">
                {a.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-fg group-hover:text-brand">{a.label}</span>
                <span className="block text-xs text-muted-fg">{a.description}</span>
              </span>
            </span>,
            undefined,
          ),
        )}
      </div>
    </SectionCard>
  );
}

/**
 * Pure presentational Siswa dashboard. Receives already-aggregated data plus a
 * renderLink, so it is fully testable without a Router or API mocks. Renders the
 * onboarding empty state when no siswa exist.
 */
export function SiswaDashboardView({
  sekolah,
  isLoading,
  isError,
  errorMessage,
  total,
  stats,
  statusData,
  genderData,
  actionItems,
  renderLink,
}: SiswaDashboardViewProps): ReactNode {
  const isZeroState = !isLoading && !isError && total === 0;

  const header = (
    <PageHeader
      eyebrow="Direktori"
      title="Dashboard Siswa"
      description="Ringkasan kesiswaan, visualisasi data, dan hal yang perlu ditindaklanjuti."
    />
  );

  if (isZeroState) {
    return (
      <div className="space-y-6">
        {header}
        <GettingStartedCard
          icon={<IconUsers />}
          title="Belum ada data siswa"
          description="Tambahkan siswa pertama untuk mulai mengelola direktori, mutasi, dan kelulusan."
          steps={[
            "Buat rombongan belajar (rombel) dulu",
            "Terima calon siswa lewat Pendaftaran atau import CSV",
            "Tetapkan wali siswa",
          ]}
          primaryAction={{ label: "Buka Pendaftaran", href: "/sch/$sekolah/siswa/pendaftaran" }}
          secondaryAction={{ label: "Import Massal (CSV)", href: "/sch/$sekolah/siswa/daftar" }}
          renderLink={renderLink}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <PageGuide
        storageNamespace="siswa-guide:"
        storageId="dashboard"
        title={SISWA_PAGE_GUIDES.dashboard.title}
        intro={SISWA_PAGE_GUIDES.dashboard.intro}
        steps={SISWA_PAGE_GUIDES.dashboard.steps}
        tips={SISWA_PAGE_GUIDES.dashboard.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      {isError ? (
        <Badge tone="danger">Gagal memuat data siswa: {errorMessage ?? "kesalahan tidak diketahui"}</Badge>
      ) : null}

      <KpiRow stats={stats} isLoading={isLoading} />

      <ChartsRow stats={stats} statusData={statusData} genderData={genderData} />

      <ModuleFlow
        title="Alur Pengelolaan Siswa"
        description="Langkah membangun direktori siswa dari nol."
        steps={SISWA_FLOW_STEPS}
        renderLink={(href, children) =>
          renderLink(href.replace("$sekolah", sekolah), children, undefined)
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Perlu Tindakan"
          description="Antrian aksi yang dihitung dari data siswa nyata."
        >
          <AttentionList items={actionItems} maxItems={ACTION_QUEUE_LIMIT} renderLink={renderLink} />
        </SectionCard>
        <QuickActions renderLink={renderLink} />
      </div>
    </div>
  );
}

/**
 * Route page: performs the data hooks, aggregates via the pure lib functions,
 * and hands the result to the presentational SiswaDashboardView.
 */
function SiswaDashboardPage(): ReactNode {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const q = useResourceList<SiswaRow>("Siswa", {
    fields: SISWA_FIELDS,
    limit_page_length: FETCH_ALL,
  });

  const rows = q.data ?? [];
  const renderLink: RenderLink = (href, children, className) => (
    <Link to={href} params={{ sekolah }} className={className}>
      {children}
    </Link>
  );

  return (
    <SiswaDashboardView
      sekolah={sekolah}
      isLoading={q.isLoading}
      isError={q.isError}
      errorMessage={q.isError ? (q.error as Error).message : undefined}
      total={rows.length}
      stats={computeSiswaStats(rows)}
      statusData={statusDonut(rows)}
      genderData={genderSegments(rows)}
      actionItems={deriveActionQueue(rows)}
      renderLink={renderLink}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/")({ component: SiswaDashboardPage });
