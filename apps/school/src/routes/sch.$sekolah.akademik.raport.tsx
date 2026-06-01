/**
 * Halaman Raport (Akademik).
 *
 * Mengelola siklus hidup raport siswa per semester:
 *   Draft -> Review -> Submitted -> Final -> Locked/Tercetak (Revised = perbaikan).
 *
 * Redesign ini menambah lapisan PRESENTASI + PANDUAN + VISUALISASI di atas daftar
 * raport tanpa mengubah satupun wiring data:
 *  - doctype "Raport", field list, filter status, baseFilters periode, kolom,
 *    pencarian, paginasi, dan mutasi generate (GenerateRaportModal) dipertahankan.
 *  - Aggregasi viz memakai query read-only `useResourceList` pada doctype yang sama
 *    (tidak ada pemanggilan backend baru).
 *
 * Audience: Administrator Akademik (generate + kelola), Kepala Sekolah (pantau %
 * final & review), Guru (kontributor nilai/kehadiran). Peran hanya untuk framing —
 * tidak pernah menyembunyikan atau menonaktifkan fungsi apa pun.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  SectionCard,
  StatCard,
  IconFile,
  IconCheck,
  IconClock,
  IconFlag,
  IconPlus,
  type Column,
  type SelectFilter,
  type SortState,
} from "@sekolahpro/ui";
import { useResourceList, type ListParams, type FilterTuple } from "@sekolahpro/api-client";
import { useAkademikContextOptional } from "../lib/akademikContext";
import { GenerateRaportModal } from "../components/akademik/GenerateRaportModal";
import { PageGuide, type PageGuideStep } from "../components/guide";
import {
  DistributionBar,
  ProgressRing,
  BarChart,
  type DistributionSegment,
  type ChartDatum,
  type Tone,
} from "../components/viz";
import { useAkademikRole, ROLE_LABEL } from "../lib/akademikRole";

type RaportStatus =
  | "Draft"
  | "Review"
  | "Submitted"
  | "Final"
  | "Locked"
  | "Revised"
  | "Tercetak";

type Row = {
  name: string;
  siswa: string;
  semester?: string;
  tahun_ajaran?: string;
  status?: RaportStatus;
  rekap_hadir?: number;
  rekap_izin?: number;
  rekap_sakit?: number;
  rekap_alpha?: number;
};

/** Field list yang diminta dari doctype Raport (TIDAK BOLEH diubah). */
const RAPORT_FIELDS = [
  "name",
  "siswa",
  "semester",
  "tahun_ajaran",
  "status",
  "rekap_hadir",
  "rekap_izin",
  "rekap_sakit",
  "rekap_alpha",
] as const;

const STATUS_OPTIONS: { value: RaportStatus; label: string }[] = [
  { value: "Draft", label: "Draft" },
  { value: "Review", label: "Review" },
  { value: "Submitted", label: "Submitted" },
  { value: "Final", label: "Final" },
  { value: "Locked", label: "Locked" },
  { value: "Revised", label: "Revised" },
  { value: "Tercetak", label: "Tercetak" },
];

/** Badge tone (sistem desain) per status raport. */
const STATUS_TONE: Record<RaportStatus, "warning" | "brand" | "success" | "neutral" | "danger"> = {
  Draft: "warning",
  Review: "brand",
  Submitted: "brand",
  Final: "success",
  Locked: "neutral",
  Revised: "danger",
  Tercetak: "success",
};

/** Warna chart (viz Tone) per status — selaras dengan badge tone. */
const STATUS_VIZ_TONE: Record<RaportStatus, Tone> = {
  Draft: "amber",
  Review: "sky",
  Submitted: "brand",
  Final: "emerald",
  Locked: "neutral",
  Revised: "rose",
  Tercetak: "violet",
};

/** Status yang dianggap "selesai dikunci" untuk metrik % final. */
const FINAL_STATUSES: ReadonlySet<RaportStatus> = new Set(["Final", "Locked", "Tercetak"]);

/** Penjelasan singkat tiap tahap siklus hidup (untuk legenda status). */
const STATUS_HINT: Record<RaportStatus, string> = {
  Draft: "Baru di-generate, masih bisa disunting.",
  Review: "Sedang diperiksa wali kelas / guru.",
  Submitted: "Diajukan untuk pengesahan.",
  Final: "Disahkan, nilai terkunci.",
  Locked: "Terkunci permanen, tidak dapat diubah.",
  Revised: "Ada perbaikan setelah final.",
  Tercetak: "Sudah dicetak / dibagikan.",
};

const PAGE_SIZE = 25;
const SUMMARY_LIMIT_ALL = 0; // Frappe: limit_page_length 0 = ambil semua baris.

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID Raport", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  { key: "semester", header: "Semester", cell: (r) => r.semester ?? "—" },
  { key: "tahun_ajaran", header: "TA", cell: (r) => r.tahun_ajaran ?? "—" },
  {
    key: "rekap_hadir",
    header: "Kehadiran",
    align: "right",
    cell: (r) => {
      const h = r.rekap_hadir ?? 0;
      const i = r.rekap_izin ?? 0;
      const s = r.rekap_sakit ?? 0;
      const a = r.rekap_alpha ?? 0;
      const total = h + i + s + a;
      if (total === 0) return <span className="text-muted-fg">—</span>;
      return (
        <span className="tabular-nums text-xs" title={`H:${h} I:${i} S:${s} A:${a}`}>
          {h}/{total}
        </span>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    cell: (r) =>
      r.status ? (
        <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>
          {r.status}
        </Badge>
      ) : (
        "—"
      ),
  },
];

/** Aggregat ringkas yang diturunkan dari seluruh baris raport pada periode. */
interface RaportSummary {
  total: number;
  statusCounts: Record<RaportStatus, number>;
  finalCount: number;
  attendance: { hadir: number; izin: number; sakit: number; alpha: number };
}

/** Hitung ringkasan status + kehadiran dari kumpulan baris raport. */
function buildSummary(rows: Row[]): RaportSummary {
  const statusCounts = Object.fromEntries(
    STATUS_OPTIONS.map((o) => [o.value, 0]),
  ) as Record<RaportStatus, number>;
  const attendance = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
  let finalCount = 0;
  for (const r of rows) {
    if (r.status && statusCounts[r.status] !== undefined) statusCounts[r.status] += 1;
    if (r.status && FINAL_STATUSES.has(r.status)) finalCount += 1;
    attendance.hadir += r.rekap_hadir ?? 0;
    attendance.izin += r.rekap_izin ?? 0;
    attendance.sakit += r.rekap_sakit ?? 0;
    attendance.alpha += r.rekap_alpha ?? 0;
  }
  return { total: rows.length, statusCounts, finalCount, attendance };
}

/** Persentase aman (0 saat pembagi nol). */
function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Segmen DistributionBar untuk komposisi status raport (status non-kosong saja). */
function statusSegments(counts: Record<RaportStatus, number>): DistributionSegment[] {
  return STATUS_OPTIONS.filter((o) => counts[o.value] > 0).map((o) => ({
    label: o.label,
    value: counts[o.value],
    tone: STATUS_VIZ_TONE[o.value],
  }));
}

/** Data BarChart rekap kehadiran agregat (H/I/S/A). */
function attendanceBars(a: RaportSummary["attendance"]): ChartDatum[] {
  return [
    { label: "Hadir", value: a.hadir, tone: "emerald" },
    { label: "Izin", value: a.izin, tone: "sky" },
    { label: "Sakit", value: a.sakit, tone: "amber" },
    { label: "Alpha", value: a.alpha, tone: "rose" },
  ];
}

/** Langkah-langkah panduan halaman, di-frame per peran. */
const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Pastikan periode aktif benar",
    detail: "Tahun Ajaran & Semester pada bilah konteks menyaring daftar dan ringkasan di bawah.",
    roles: ["admin", "kepala"],
  },
  {
    title: "Generate raport siswa",
    detail: "Klik Generate Raport untuk membangun draft dari seluruh Entri Nilai siswa terpilih.",
    roles: ["admin"],
  },
  {
    title: "Periksa & sahkan",
    detail: "Pantau komposisi status: Draft butuh penyuntingan, Review/Submitted menunggu pengesahan.",
    roles: ["guru", "kepala"],
  },
  {
    title: "Pantau progres % final",
    detail: "Cincin progres menunjukkan berapa raport yang sudah Final/Locked/Tercetak.",
    roles: ["kepala"],
  },
];

const GUIDE_TIPS = [
  "Alur status: Draft → Review → Submitted → Final → Locked/Tercetak. Revised = perbaikan setelah final.",
  "Kolom Kehadiran menampilkan Hadir/Total; arahkan kursor untuk rincian Izin, Sakit, Alpha.",
];

/** Kartu metrik ringkas di atas daftar. */
function SummaryStats({ summary }: { summary: RaportSummary }) {
  const finalPct = pct(summary.finalCount, summary.total);
  const draft = summary.statusCounts.Draft;
  const review = summary.statusCounts.Review + summary.statusCounts.Submitted;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Raport" value={summary.total} icon={<IconFile />} accent="brand" />
      <StatCard
        label="Sudah Final"
        value={summary.finalCount}
        hint={`${finalPct}% dari total`}
        icon={<IconCheck />}
        accent="emerald"
      />
      <StatCard
        label="Menunggu Review"
        value={review}
        hint="Review + Submitted"
        icon={<IconClock />}
        accent="amber"
        urgency={review > 0 ? "warn" : "normal"}
      />
      <StatCard
        label="Masih Draft"
        value={draft}
        hint="Perlu disunting"
        icon={<IconFlag />}
        accent="violet"
      />
    </div>
  );
}

/** Panel visualisasi: komposisi status, % final, rekap kehadiran agregat. */
function RaportViz({ summary }: { summary: RaportSummary }) {
  const segments = statusSegments(summary.statusCounts);
  const finalPct = pct(summary.finalCount, summary.total);
  const hasData = summary.total > 0;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <SectionCard title="Komposisi Status" description="Sebaran raport pada setiap tahap.">
        {hasData ? (
          <DistributionBar segments={segments} />
        ) : (
          <EmptyState title="Belum ada raport" description="Generate raport untuk melihat sebaran status." />
        )}
      </SectionCard>
      <SectionCard title="Progres Pengesahan" description="Final / Locked / Tercetak.">
        <div className="flex items-center justify-center py-2">
          <ProgressRing
            value={finalPct}
            tone="emerald"
            label={`${summary.finalCount}/${summary.total} final`}
          />
        </div>
      </SectionCard>
      <SectionCard title="Rekap Kehadiran" description="Total H/I/S/A seluruh raport periode.">
        {hasData ? (
          <BarChart data={attendanceBars(summary.attendance)} />
        ) : (
          <EmptyState title="Belum ada data" description="Rekap kehadiran muncul setelah raport dibuat." />
        )}
      </SectionCard>
    </div>
  );
}

/** Legenda status: jembatan antara warna chart, badge, dan makna tahap. */
function StatusLegend() {
  return (
    <SectionCard title="Legenda Status Raport" description="Arti setiap tahap pada siklus hidup raport.">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {STATUS_OPTIONS.map((o) => (
          <li key={o.value} className="flex items-start gap-2 text-sm">
            <Badge tone={STATUS_TONE[o.value]} dot>
              {o.label}
            </Badge>
            <span className="text-xs text-muted-fg">{STATUS_HINT[o.value]}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/** Bangun klausa filter periode dari konteks akademik (TA + semester). */
function usePeriodFilters(ctx: ReturnType<typeof useAkademikContextOptional>) {
  return useMemo(() => {
    const out: Array<[string, string, string]> = [];
    if (ctx?.tahunAjaran) out.push(["tahun_ajaran", "=", ctx.tahunAjaran]);
    if (ctx?.semester) out.push(["semester", "=", ctx.semester]);
    return out.length > 0 ? out : undefined;
  }, [ctx?.tahunAjaran, ctx?.semester]);
}

function RaportPage() {
  const ctx = useAkademikContextOptional();
  const role = useAkademikRole();
  const periodeSuffix = ctx?.tahunAjaran ? ` · Periode: ${ctx.tahunAjaran} ${ctx.semester}` : "";
  const [openGenerate, setOpenGenerate] = useState(false);

  // Filter, sort, paginasi daftar (perilaku setara ResourceListPage sebelumnya).
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [sort, setSort] = useState<SortState>({ key: "name", dir: "desc" });
  const [page, setPage] = useState(1);

  const baseFilters = usePeriodFilters(ctx);

  // Query agregat read-only (semua baris periode) untuk viz/stat — tanpa pencarian.
  const summaryParams: ListParams = useMemo(() => {
    const p: ListParams = { fields: [...RAPORT_FIELDS], limit_page_length: SUMMARY_LIMIT_ALL };
    if (baseFilters && baseFilters.length) p.filters = baseFilters as FilterTuple[];
    return p;
  }, [baseFilters]);
  const summaryQuery = useResourceList<Row>("Raport", summaryParams);
  const summary = useMemo(() => buildSummary(summaryQuery.data ?? []), [summaryQuery.data]);

  // Query daftar berpaginasi (filter status + pencarian + periode).
  const listFilters = useMemo(() => {
    const out: Array<[string, string, string]> = [...(baseFilters ?? [])];
    if (statusFilter !== "Semua") out.push(["status", "=", statusFilter]);
    if (search.trim()) out.push(["name", "like", `%${search.trim()}%`]);
    return out;
  }, [baseFilters, statusFilter, search]);

  const orFilters = useMemo(() => {
    if (!search.trim()) return undefined;
    return [
      ["name", "like", `%${search.trim()}%`],
      ["siswa", "like", `%${search.trim()}%`],
    ] as Array<[string, string, string]>;
  }, [search]);

  const listParams: ListParams = useMemo(() => {
    const p: ListParams = {
      fields: [...RAPORT_FIELDS],
      order_by: `\`${sort.key}\` ${sort.dir}`,
      limit_start: (page - 1) * PAGE_SIZE,
      limit_page_length: PAGE_SIZE + 1,
    };
    if (orFilters) {
      p.or_filters = orFilters as FilterTuple[];
      const scoped = listFilters.filter(([f, op]) => !(f === "name" && op === "like"));
      if (scoped.length) p.filters = scoped as FilterTuple[];
    } else if (listFilters.length) {
      p.filters = listFilters as FilterTuple[];
    }
    return p;
  }, [sort, page, orFilters, listFilters]);

  const listQuery = useResourceList<Row>("Raport", listParams);
  const fetched = listQuery.data ?? [];
  const hasNext = fetched.length > PAGE_SIZE;
  const rows = hasNext ? fetched.slice(0, PAGE_SIZE) : fetched;

  const filterUI: SelectFilter[] = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      options: STATUS_OPTIONS,
      onChange: (v) => {
        setStatusFilter(v);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik"
        title="Raport"
        description={`Kelola raport siswa per semester. Status mengikuti alur Draft → Review → Submitted → Final → Locked/Tercetak.${periodeSuffix}`}
        actions={
          <Button onClick={() => setOpenGenerate(true)}>
            {/* Size the icon directly: a wrapper span does not constrain a raw svg */}
            <IconPlus className="mr-1.5 h-4 w-4 shrink-0" />
            Generate Raport
          </Button>
        }
      />

      <PageGuide
        storageId="raport"
        intro={`Halaman ini mengikuti alur kerja Anda sebagai ${ROLE_LABEL[role.primary]}. Semua peran tetap dapat memakai seluruh fungsi.`}
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <SummaryStats summary={summary} />
      <RaportViz summary={summary} />
      <StatusLegend />

      <FilterBar
        search={{
          value: search,
          onChange: (v) => {
            setSearch(v);
            setPage(1);
          },
          placeholder: "Cari ID raport atau nama siswa...",
        }}
        filters={filterUI}
      />

      <SectionCard
        title={`${rows.length} baris${listQuery.isFetching && rows.length > 0 ? " · memuat..." : ""}`}
        action={
          listQuery.isError ? (
            <div className="flex items-center gap-2">
              <Badge tone="danger">Gagal memuat</Badge>
              <Button variant="outline" onClick={() => listQuery.refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : null
        }
        padded={false}
      >
        <DataTable
          data={rows}
          columns={COLUMNS}
          rowKey={(r) => r.name}
          sort={sort}
          onSortChange={setSort}
          empty={
            <div>
              <div className="font-medium text-fg">
                {listQuery.isError ? "Gagal memuat data" : "Belum ada raport"}
              </div>
              <div className="mt-1 text-xs">
                {listQuery.isError
                  ? (listQuery.error as Error).message
                  : "Generate raport atau ubah filter periode/status."}
              </div>
            </div>
          }
          footer={
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={(page - 1) * PAGE_SIZE + rows.length + (hasNext ? 1 : 0)}
              onPageChange={setPage}
            />
          }
        />
      </SectionCard>

      <GenerateRaportModal
        open={openGenerate}
        onClose={() => setOpenGenerate(false)}
        initial={{
          ...(ctx?.semester ? { semester: ctx.semester } : {}),
          ...(ctx?.tahunAjaran ? { tahunAjaran: ctx.tahunAjaran } : {}),
        }}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/raport")({ component: RaportPage });
