import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  IconAlert,
  IconGrad,
  IconFile,
  IconPlus,
  IconBook,
  type ModuleFlowStep,
  type AttentionItem,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { DonutChart, HBarChart, DistributionBar, ProgressRing } from "../components/viz";
import type { ChartDatum, DistributionSegment } from "../components/viz/charts";
import { PageGuide } from "../components/guide";
import { STAFF_PAGE_GUIDES } from "../components/staff/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";
import {
  roleDonut,
  statusKepegawaianBars,
  sertifikasiCoverage,
  genderSegments,
  aktifCount,
  deriveStaffActionQueue,
  type SertifikasiCoverage,
} from "../lib/orang/staffStats";
import { glossaryFor } from "../lib/orang/glossary";
import { type PegawaiApi } from "../features/pegawai/roles";

// Only fields confirmed in the Pegawai list route + the PegawaiApi interface are
// requested, so the Frappe API never errors on an unknown fieldname.
const PEGAWAI_FIELDS = [
  "name",
  "nama_lengkap",
  "nip",
  "jabatan_fungsional",
  "status_kepegawaian",
  "sekolah",
  "is_aktif",
  "jenis_kelamin",
  "sudah_sertifikasi",
  "roles.role",
];
// Server page size; pegawai counts per school comfortably fit one page.
const PEGAWAI_LIMIT = 500;
// Cap the action queue rendered on the dashboard.
const ACTION_QUEUE_LIMIT = 6;
// Role-donut slice labels (kept distinct from the KPI card labels by suffixing
// the value, so the legend text never collides with the headline cards).
const ROLE_LABEL_GURU = "Guru";
const ROLE_LABEL_STAFF = "Staff";
const ROLE_LABEL_DUAL = "Dual-role";

/** A renderLink lets the pure View stay router-free for testing. */
type RenderLink = (href: string, children: ReactNode, className?: string) => ReactNode;

/** Headline counts shown as KPI cards. */
export interface StaffCounts {
  total: number;
  guru: number;
  staff: number;
  dual: number;
  aktif: number;
}

/** Fully-aggregated data the presentational dashboard renders (no hooks). */
export interface StaffDashboardData {
  counts: StaffCounts;
  roleDonut: ChartDatum[];
  statusBars: ChartDatum[];
  sertifikasi: SertifikasiCoverage;
  genderSegments: DistributionSegment[];
  actionQueue: AttentionItem[];
}

/** Props for the pure presentational dashboard (no hooks, no fetching). */
export interface StaffDashboardViewProps {
  data: StaffDashboardData;
  renderLink: RenderLink;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | undefined;
}

/** Guided onboarding steps for building the personnel directory from scratch. */
const STAFF_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "daftar", label: "Daftar Pegawai", hint: "Input data guru & staff", href: "/sch/$sekolah/staff/daftar" },
  { key: "jabatan", label: "Jabatan", hint: "Tetapkan jenis jabatan", href: "/sch/$sekolah/staff/jabatan" },
  { key: "mapel", label: "Mapel Pengampu", hint: "Petakan guru ke mata pelajaran", href: "/sch/$sekolah/staff/mapel-pengampu" },
  { key: "penugasan", label: "Penugasan", hint: "Susun penugasan mengajar", href: "/sch/$sekolah/staff/penugasan" },
  { key: "sk", label: "SK Mengajar", hint: "Terbitkan surat keputusan", href: "/sch/$sekolah/staff/sk-mengajar" },
];

/** Quick-action shortcuts to the most-used personnel workflows. */
const QUICK_ACTIONS: { to: string; label: string; description: string; icon: ReactNode }[] = [
  { to: "/sch/$sekolah/staff/daftar", label: "Tambah Pegawai", description: "Daftarkan guru atau staff baru.", icon: <IconPlus /> },
  { to: "/sch/$sekolah/staff/jabatan", label: "Kelola Jabatan", description: "Atur jenis jabatan & struktur.", icon: <IconBook /> },
  { to: "/sch/$sekolah/staff/penugasan", label: "Penugasan Mengajar", description: "Susun beban dan jam mengajar.", icon: <IconGrad /> },
  { to: "/sch/$sekolah/staff/sk-mengajar", label: "Terbitkan SK", description: "Buat SK mengajar untuk guru.", icon: <IconFile /> },
  { to: "/sch/$sekolah/staff/berkas", label: "Berkas Pegawai", description: "Pantau dokumen & masa berlaku.", icon: <IconFile /> },
];

/** A glossary term rendered as a tooltip; empty definition is harmless. */
function Term({ term }: { term: string }): ReactNode {
  return <GlossaryTooltip term={term} definition={glossaryFor(term) ?? ""} />;
}

/** Suffix each role slice with its value so legend text never equals a KPI label. */
function labelledRoleDonut(data: ChartDatum[]): ChartDatum[] {
  return data.map((d) => ({ ...d, label: `${d.label} (${d.value})` }));
}

/** The five headline KPI cards, all derived from real counts. */
function KpiRow({ counts, isLoading }: { counts: StaffCounts; isLoading: boolean }): ReactNode {
  const show = (n: number): string => (isLoading ? "…" : n.toLocaleString("id-ID"));
  return (
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total Pegawai" value={show(counts.total)} hint="guru & staff" icon={<IconUsers />} accent="brand" />
      <StatCard label="Guru" value={show(counts.guru)} hint="tenaga pendidik" icon={<IconGrad />} accent="emerald" />
      <StatCard label="Staff" value={show(counts.staff)} hint="kependidikan" icon={<IconCheck />} accent="violet" />
      <StatCard label="Dual-role" value={show(counts.dual)} hint="guru + staff" icon={<IconAlert />} accent="amber" />
      <StatCard label="Aktif" value={show(counts.aktif)} hint="berstatus aktif" icon={<IconCheck />} accent="emerald" />
    </div>
  );
}

/** Role donut + status bars + sertifikasi ring + gender distribution. */
function ChartsRow({ data }: { data: StaffDashboardData }): ReactNode {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      <SectionCard title="Komposisi Peran" description="Proporsi guru, staff, dan dual-role.">
        <DonutChart data={labelledRoleDonut(data.roleDonut)} centerTop={data.counts.total} centerBottom="pegawai" />
      </SectionCard>
      <SectionCard
        title="Status Kepegawaian"
        description="Jumlah pegawai per status (PNS, GTY, dst)."
      >
        <HBarChart data={data.statusBars} />
      </SectionCard>
      <SectionCard
        title={<>Cakupan <Term term="Sertifikasi" /></>}
        description="Persentase guru yang sudah tersertifikasi."
      >
        <div className="flex items-center justify-center py-2">
          <ProgressRing
            value={data.sertifikasi.pct}
            tone="emerald"
            label={`${data.sertifikasi.certified} dari ${data.sertifikasi.total} guru`}
          />
        </div>
      </SectionCard>
      <SectionCard title="Komposisi Gender" description="Proporsi pegawai laki-laki dan perempuan.">
        <DistributionBar segments={data.genderSegments} />
      </SectionCard>
    </div>
  );
}

/** The "Aksi Cepat" shortcut grid. */
function QuickActions({ renderLink }: { renderLink: RenderLink }): ReactNode {
  return (
    <SectionCard title="Aksi Cepat" description="Pintasan ke alur kerja kepegawaian yang sering digunakan.">
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
 * Pure presentational Guru & Staff dashboard. Receives already-aggregated data
 * plus a renderLink, so it is fully testable without a Router or API mocks.
 * Renders the onboarding empty state when no pegawai exist.
 */
export function StaffDashboardView({
  data,
  renderLink,
  isLoading = false,
  isError = false,
  errorMessage,
}: StaffDashboardViewProps): ReactNode {
  const isZeroState = !isLoading && !isError && data.counts.total === 0;

  const header = (
    <PageHeader
      eyebrow="Kepegawaian"
      title="Dashboard Guru & Staff"
      description="Ringkasan tenaga pendidik dan kependidikan, visualisasi data, dan hal yang perlu ditindaklanjuti."
    />
  );

  if (isZeroState) {
    return (
      <div className="space-y-6">
        {header}
        <GettingStartedCard
          icon={<IconUsers />}
          title="Belum ada data pegawai"
          description="Tambahkan guru atau staff pertama untuk mulai mengelola penugasan, SK, dan berkas."
          steps={[
            "Input data pegawai (guru & staff)",
            "Tetapkan jenis jabatan",
            "Susun penugasan mengajar dan terbitkan SK",
          ]}
          primaryAction={{ label: "Tambah Pegawai", href: "/sch/$sekolah/staff/daftar" }}
          secondaryAction={{ label: "Kelola Jabatan", href: "/sch/$sekolah/staff/jabatan" }}
          renderLink={renderLink}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <PageGuide
        storageNamespace="staff-guide:"
        storageId="dashboard"
        title={STAFF_PAGE_GUIDES.dashboard.title}
        intro={STAFF_PAGE_GUIDES.dashboard.intro}
        steps={STAFF_PAGE_GUIDES.dashboard.steps}
        tips={STAFF_PAGE_GUIDES.dashboard.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      {isError ? (
        <Badge tone="danger">Gagal memuat data pegawai: {errorMessage ?? "kesalahan tidak diketahui"}</Badge>
      ) : null}

      <KpiRow counts={data.counts} isLoading={isLoading} />

      <ChartsRow data={data} />

      <ModuleFlow
        title="Alur Pengelolaan Kepegawaian"
        description="Langkah membangun data guru & staff dari nol."
        steps={STAFF_FLOW_STEPS}
        renderLink={(href, children) => renderLink(href, children, undefined)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Perlu Tindakan"
          description="Antrian aksi yang dihitung dari data pegawai nyata."
        >
          <AttentionList items={data.actionQueue} maxItems={ACTION_QUEUE_LIMIT} renderLink={renderLink} />
        </SectionCard>
        <QuickActions renderLink={renderLink} />
      </div>
    </div>
  );
}

/** Headline role counts, single-sourced from the role donut (no double-count). */
function deriveCounts(list: PegawaiApi[], donut: ChartDatum[]): StaffCounts {
  const byLabel = (label: string): number => donut.find((d) => d.label === label)?.value ?? 0;
  return {
    total: list.length,
    guru: byLabel(ROLE_LABEL_GURU),
    staff: byLabel(ROLE_LABEL_STAFF),
    dual: byLabel(ROLE_LABEL_DUAL),
    aktif: aktifCount(list),
  };
}

/**
 * Route page: performs the data hooks, aggregates via the pure lib functions,
 * and hands the result to the presentational StaffDashboardView.
 */
function StaffIndex(): ReactNode {
  const { sekolah } = Route.useParams();
  const q = useResourceList<PegawaiApi>("Pegawai", {
    fields: PEGAWAI_FIELDS,
    filters: { sekolah },
    order_by: "modified desc",
    limit_page_length: PEGAWAI_LIMIT,
  });

  const list = q.data ?? [];
  const donut = roleDonut(list);
  const data: StaffDashboardData = {
    counts: deriveCounts(list, donut),
    roleDonut: donut,
    statusBars: statusKepegawaianBars(list),
    sertifikasi: sertifikasiCoverage(list),
    genderSegments: genderSegments(list),
    actionQueue: deriveStaffActionQueue(list),
  };

  const renderLink: RenderLink = (href, children, className) => (
    <Link to={href.replace("$sekolah", sekolah)} params={{ sekolah }} className={className}>
      {children}
    </Link>
  );

  return (
    <StaffDashboardView
      data={data}
      renderLink={renderLink}
      isLoading={q.isLoading}
      isError={q.isError}
      errorMessage={q.isError ? (q.error as Error).message : undefined}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/staff/")({ component: StaffIndex });
