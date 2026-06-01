/**
 * Entri Nilai — selector / list page.
 *
 * Lists "Entri Nilai" documents (one per siswa × mapel × semester) and lets a
 * teacher jump into the fast grid editor. This is a PRESENTATION + GUIDANCE
 * redesign: the underlying list query, filters, columns, sorting, search and the
 * navigation into the editor are preserved exactly via {@link ResourceListPage}.
 *
 * What the redesign adds, layered ABOVE the untouched list:
 *  - a collapsible PageGuide (how to enter grades, step by step);
 *  - a WorkflowStepper showing where grade entry sits in the academic flow;
 *  - role framing for Administrator / Guru / Kepala Sekolah (labels only,
 *    nothing is hidden or disabled by role);
 *  - a small legend visualization of the predikat color scale, derived purely
 *    from this page's own constants (no new backend calls).
 *
 * All UI copy is Bahasa Indonesia; code comments are English.
 */
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Badge, Button, SectionCard, cn, type Column } from "@sekolahpro/ui";
import { useResourceList, type ListParams } from "@sekolahpro/api-client";
import { ResourceListPage } from "../components/ResourceListPage";
import { useAkademikContextOptional } from "../lib/akademikContext";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { DistributionBar, HBarChart, type DistributionSegment, type ChartDatum } from "../components/viz";
import { useAkademikRole, ROLE_LABEL, type AkademikRole } from "../lib/akademikRole";
import { useMemo, type ReactNode } from "react";

type Row = {
  name: string;
  siswa: string;
  mata_pelajaran: string;
  semester?: string;
  tahun_ajaran?: string;
  tingkat?: string;
  nilai_akhir?: number;
  predikat?: string;
};

const PREDIKAT_TONE: Record<string, "success" | "brand" | "warning" | "danger"> = {
  A: "success",
  B: "brand",
  C: "warning",
  D: "danger",
};

/** Maps a predikat letter to a viz tone for the legend distribution bar. */
const PREDIKAT_VIZ_TONE: Record<string, DistributionSegment["tone"]> = {
  A: "emerald",
  B: "brand",
  C: "amber",
  D: "rose",
};

/** Friendly Bahasa description for each predikat band shown in the legend. */
const PREDIKAT_KETERANGAN: Record<string, string> = {
  A: "Sangat baik",
  B: "Baik",
  C: "Cukup",
  D: "Perlu perbaikan",
};

/** Ordered predikat letters for the legend (best -> needs work). */
const PREDIKAT_ORDER: readonly string[] = ["A", "B", "C", "D"];

const COLUMNS: Column<Row>[] = [
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  { key: "mata_pelajaran", header: "Mata Pelajaran", sortable: true, cell: (r) => r.mata_pelajaran },
  { key: "tingkat", header: "Tingkat", align: "center", cell: (r) => r.tingkat ?? "—" },
  { key: "semester", header: "Semester", cell: (r) => r.semester ?? "—" },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  {
    key: "nilai_akhir",
    header: "Nilai Akhir",
    align: "right",
    sortable: true,
    cell: (r) => (r.nilai_akhir != null ? <span className="tabular-nums">{r.nilai_akhir.toFixed(2)}</span> : "—"),
  },
  {
    key: "predikat",
    header: "Predikat",
    align: "center",
    cell: (r) => (r.predikat ? <Badge tone={PREDIKAT_TONE[r.predikat] ?? "neutral"}>{r.predikat}</Badge> : "—"),
  },
];

/** Steps shown in the in-page guide, scoped to the relevant roles. */
const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Pilih kelas & mata pelajaran",
    detail: "Periode (tahun ajaran & semester) mengikuti konteks aktif di header.",
    roles: ["guru"],
  },
  {
    title: "Buka Editor Grid lalu isi nilai per komponen",
    detail: "Klik \"Buka Editor Grid\" untuk input cepat semua siswa dalam satu layar.",
    roles: ["guru"],
  },
  {
    title: "Cek ketuntasan terhadap KKM",
    detail: "Pastikan nilai akhir & predikat sudah wajar sebelum dikunci.",
    roles: ["guru", "admin"],
  },
  {
    title: "Pantau & teruskan ke Raport",
    detail: "Nilai yang sudah lengkap menjadi sumber data cetak raport.",
    roles: ["kepala", "admin"],
  },
];

/** Tips block for the guide. */
const GUIDE_TIPS: ReactNode[] = [
  "Gunakan kotak pencarian untuk menemukan dokumen siswa atau mapel tertentu.",
  "Kolom Nilai Akhir & Predikat bisa diurutkan untuk menemukan nilai yang belum lengkap.",
];

/** Step labels for the academic grade-entry workflow stepper. */
const WORKFLOW_STEPS: readonly string[] = [
  "Pilih Kelas & Mapel",
  "Entri Nilai",
  "Cek Ketuntasan",
  "Raport",
];

/** Index of the active step (entry is the focus of this page). */
const ACTIVE_WORKFLOW_STEP = 1;

/** Per-primary-role framing copy. Labels only; nothing is hidden by role. */
const ROLE_FRAME_MESSAGE: Record<AkademikRole, string> = {
  guru: "Sebagai Guru: pilih kelas & mapel, lalu isi nilai siswa lewat Editor Grid.",
  admin: "Sebagai Administrator Akademik: pantau kelengkapan entri nilai lintas kelas & mapel.",
  kepala: "Sebagai Kepala Sekolah: tinjau progres pengisian nilai sebelum periode raport.",
};

/**
 * Role framing card. Explains, per audience, what this page is for. Never hides
 * functionality — it only labels the dominant flow for the primary role.
 */
function RoleFrame({ primary }: { primary: AkademikRole }): ReactNode {
  return (
    <SectionCard className="border-brand/20">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand">{ROLE_LABEL[primary]}</Badge>
        <span className="text-sm text-muted-fg">{ROLE_FRAME_MESSAGE[primary]}</span>
      </div>
    </SectionCard>
  );
}

/** A single dot+label in the lightweight workflow stepper. */
function WorkflowStep({ label, index }: { label: string; index: number }): ReactNode {
  const done = index < ACTIVE_WORKFLOW_STEP;
  const active = index === ACTIVE_WORKFLOW_STEP;
  const dotClass = done
    ? "bg-emerald-500 text-white"
    : active
      ? "bg-brand text-white"
      : "bg-muted text-muted-fg";
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          dotClass,
        )}
      >
        {index + 1}
      </span>
      <span className={cn("text-sm", active ? "font-semibold text-fg" : "text-muted-fg")}>
        {label}
      </span>
    </div>
  );
}

/** Builds the predikat legend segments (equal weight: this is a scale legend). */
function buildPredikatSegments(): DistributionSegment[] {
  return PREDIKAT_ORDER.map((letter) => ({
    label: `${letter} · ${PREDIKAT_KETERANGAN[letter]}`,
    value: 1,
    tone: PREDIKAT_VIZ_TONE[letter] ?? "neutral",
  }));
}

/** Max mata pelajaran bars shown in the comparison chart (keeps it readable). */
const MAX_COMPARISON_BARS = 8;
const ROUND_FACTOR = 10;
/** Upper bound of rows pulled for the aggregate comparison query. */
const COMPARISON_QUERY_LIMIT = 2000;

/**
 * Average `nilai_akhir` per mata pelajaran, highest first, for the comparison
 * chart. Only rows with a numeric nilai_akhir contribute; mapel with no graded
 * rows are dropped. Result is capped at {@link MAX_COMPARISON_BARS}.
 */
export function buildMapelAverages(
  rows: ReadonlyArray<Pick<Row, "mata_pelajaran" | "nilai_akhir">>,
): ChartDatum[] {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    if (r.nilai_akhir == null || Number.isNaN(r.nilai_akhir)) continue;
    const key = r.mata_pelajaran || "—";
    const cur = acc.get(key) ?? { sum: 0, n: 0 };
    cur.sum += r.nilai_akhir;
    cur.n += 1;
    acc.set(key, cur);
  }
  return [...acc.entries()]
    .map(([label, { sum, n }]): ChartDatum => ({
      label,
      value: Math.round((sum / n) * ROUND_FACTOR) / ROUND_FACTOR,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_COMPARISON_BARS);
}

/**
 * Comparison card: average final score per mata pelajaran for the active
 * period, so a kepala sekolah / admin can compare subjects at a glance.
 * Derived from a read-only aggregate query (no mutation, no extra writes).
 */
function MapelComparisonCard({ rows, loading }: { rows: ChartDatum[]; loading: boolean }): ReactNode {
  return (
    <SectionCard
      title="Perbandingan Rata-rata Nilai per Mata Pelajaran"
      description="Rata-rata nilai akhir siswa pada periode aktif, tertinggi di atas."
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-muted-fg">Memuat perbandingan…</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-fg">
          Belum ada nilai akhir untuk dibandingkan pada periode ini.
        </p>
      ) : (
        <HBarChart data={rows} max={100} valueFormatter={(v) => v.toFixed(1)} />
      )}
    </SectionCard>
  );
}

/**
 * Predikat scale card. A foundation DistributionBar used as a colour legend so
 * teachers read the table's predikat badges consistently. Built only from local
 * constants — no backend call. Live counts live in the table below.
 */
function PredikatScaleCard(): ReactNode {
  const segments = useMemo(buildPredikatSegments, []);
  return (
    <SectionCard
      title="Skala Predikat"
      description="Acuan warna predikat. Rekap nilai sesungguhnya tampil pada tabel di bawah."
    >
      <DistributionBar segments={segments} />
    </SectionCard>
  );
}

/**
 * Workflow card showing where grade entry sits in the academic pipeline:
 * Pilih Kelas & Mapel -> Entri Nilai -> Cek Ketuntasan -> Raport.
 */
function WorkflowCard(): ReactNode {
  return (
    <SectionCard
      title="Alur Entri Nilai"
      description="Posisi entri nilai dalam rangkaian penilaian akademik."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        {WORKFLOW_STEPS.map((label, index) => (
          <WorkflowStep key={label} label={label} index={index} />
        ))}
      </div>
    </SectionCard>
  );
}

function EntriNilaiPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const navigate = useNavigate();
  const ctx = useAkademikContextOptional();
  const { primary } = useAkademikRole();
  const periodeSuffix = ctx?.tahunAjaran ? ` · Periode: ${ctx.tahunAjaran} ${ctx.semester}` : "";

  const baseFilters = useMemo(() => {
    const out: Array<[string, string, string]> = [];
    if (ctx?.tahunAjaran) out.push(["tahun_ajaran", "=", ctx.tahunAjaran]);
    if (ctx?.semester) out.push(["semester", "=", ctx.semester]);
    return out.length > 0 ? out : undefined;
  }, [ctx?.tahunAjaran, ctx?.semester]);

  // Read-only aggregate (all rows for the period, no search/paging) feeding the
  // per-mapel comparison chart. Separate from the paginated table below.
  const aggParams: ListParams = useMemo(() => {
    const p: ListParams = {
      fields: ["name", "mata_pelajaran", "nilai_akhir"],
      limit_page_length: COMPARISON_QUERY_LIMIT,
    };
    if (baseFilters) p.filters = baseFilters;
    return p;
  }, [baseFilters]);
  const aggQuery = useResourceList<Row>("Entri Nilai", aggParams);
  const mapelAverages = useMemo(() => buildMapelAverages(aggQuery.data ?? []), [aggQuery.data]);

  const openEditor = () => {
    const search: Record<string, string> = {};
    if (ctx?.semester) search.semester = ctx.semester;
    if (ctx?.tahunAjaran) search.ta = ctx.tahunAjaran;
    navigate({ to: "/sch/$sekolah/akademik/entri-nilai/edit", params: { sekolah }, search });
  };

  return (
    <div className="space-y-6">
      <PageGuide
        storageId="entri-nilai-list"
        intro="Halaman untuk memilih dokumen entri nilai dan masuk ke editor grid pengisian nilai siswa per mata pelajaran."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <RoleFrame primary={primary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <WorkflowCard />
        <PredikatScaleCard />
      </div>

      <MapelComparisonCard rows={mapelAverages} loading={aggQuery.isLoading} />

      <ResourceListPage<Row>
        eyebrow="Akademik"
        title="Entri Nilai"
        description={`Rekap dokumen entri nilai per siswa × mapel × semester. Gunakan editor grid untuk input cepat.${periodeSuffix}`}
        doctype="Entri Nilai"
        fields={[
          "name",
          "siswa",
          "mata_pelajaran",
          "tingkat",
          "semester",
          "tahun_ajaran",
          "nilai_akhir",
          "predikat",
        ]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "modified", dir: "desc" }}
        searchFields={["name", "siswa", "mata_pelajaran"]}
        {...(baseFilters ? { baseFilters } : {})}
        addLabel="Buka Editor Grid"
        onAdd={openEditor}
        extraActions={
          <Button variant="outline" onClick={openEditor}>
            Editor Grid
          </Button>
        }
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/entri-nilai")({ component: EntriNilaiPage });
