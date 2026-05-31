// Akademik dashboard (landing) — role-aware command center for
// Administrator Akademik, Guru, and Kepala Sekolah. Presentation, guidance,
// and visualization redesign only: every data hook, doctype/field name, filter,
// and the AttentionList + cut-off raport logic are preserved verbatim.
import { useMemo } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  AttentionList,
  Badge,
  Button,
  PageHeader,
  SectionCard,
  StatCard,
  IconBook,
  IconCheck,
  IconAlert,
  IconEdit,
  IconFile,
  IconGrad,
  IconSettings,
  IconChart,
  IconUsers,
  GlossaryTooltip,
  ModuleFlow,
  cn,
} from "@sekolahpro/ui";
import type { AttentionItem, ModuleFlowStep } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../lib/glossary";
import { useAkademikContextOptional } from "../lib/akademikContext";
import {
  DonutChart,
  DistributionBar,
  HBarChart,
  ProgressRing,
} from "../components/viz";
import type { ChartDatum, DistributionSegment } from "../components/viz/charts";
import { PageGuide } from "../components/guide";
import { useAkademikRole, ROLE_LABEL } from "../lib/akademikRole";
import type { AkademikRole } from "../lib/akademikRole";

type Mapel = {
  name: string;
  nama_mapel: string;
  kode_mapel: string;
  kelompok_mapel?: string;
  modified?: string;
};
type Kkm = { name: string; mata_pelajaran: string };
type Kurikulum = { name: string; nama?: string; is_aktif?: 0 | 1 };
type Komponen = { name: string; mata_pelajaran?: string };
type TahunAjaran = {
  name: string;
  nama?: string;
  is_current?: 0 | 1;
  semester_ganjil_akhir?: string;
  semester_genap_akhir?: string;
};

const MAPEL_FIELDS = ["name", "nama_mapel", "kode_mapel", "kelompok_mapel", "modified"];
const KKM_FIELDS = ["name", "mata_pelajaran"];
const KURIKULUM_FIELDS = ["name", "nama", "is_aktif"];
const KOMPONEN_FIELDS = ["name", "mata_pelajaran"];
const TA_FIELDS = ["name", "nama", "is_current", "semester_ganjil_akhir", "semester_genap_akhir"];

const PAGE_LIMIT = 200;
const RECENT_LIMIT = 5;
const ATTENTION_CAP = 20;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Cut-off urgency thresholds (in days) — named to avoid magic numbers.
const CUTOFF_CRITICAL_DAYS = 7;
const CUTOFF_WARN_DAYS = 14;

// Number of foundation setup pillars feeding the overall completeness ring.
const SETUP_PILLAR_COUNT = 4;
const PERCENT_MAX = 100;
const HBAR_GROUP_LIMIT = 8;

// Completeness ring tone thresholds (percent).
const SETUP_GOOD_PCT = 80;
const SETUP_OK_PCT = 50;

function daysUntil(target: Date, from: Date): number {
  return Math.max(0, Math.ceil((target.getTime() - from.getTime()) / MS_PER_DAY));
}

function parseDateOrNull(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

type QuickAction = {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: "brand" | "emerald" | "violet" | "amber" | "rose" | "sky";
};

// Role-framed quick-action groups. Every existing destination is preserved;
// grouping is purely presentational so each role finds its tasks fast.
type QuickActionGroup = {
  role: AkademikRole;
  blurb: string;
  actions: QuickAction[];
};

// Alur penilaian: langkah setup (kurikulum→komponen) kini di Master Data,
// langkah operasional (input test→entri→raport) tetap di modul Akademik.
const AKADEMIK_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "kurikulum", label: "Kurikulum", hint: "Tetapkan kurikulum aktif", href: "/sch/$sekolah/master/kurikulum" },
  { key: "mapel", label: "Mata Pelajaran", hint: "Daftar mapel & kode", href: "/sch/$sekolah/master/mapel" },
  { key: "kkm", label: "KKM", hint: "Ketuntasan minimal", href: "/sch/$sekolah/master/kkm" },
  { key: "komponen", label: "Komponen Nilai", hint: "Bobot per komponen", href: "/sch/$sekolah/master/komponen-nilai" },
  { key: "asesmen", label: "Input Nilai Test", hint: "Nilai per test/ulangan", href: "/sch/$sekolah/akademik/asesmen" },
  { key: "entri", label: "Entri Nilai", hint: "Input nilai siswa", href: "/sch/$sekolah/akademik/entri-nilai" },
  { key: "raport", label: "Raport", hint: "Susun & cetak raport", href: "/sch/$sekolah/akademik/raport" },
];

const QUICK_ACTION_GROUPS: QuickActionGroup[] = [
  {
    role: "guru",
    blurb: "Tugas harian guru: masukkan dan rekap nilai.",
    actions: [
      { to: "/sch/$sekolah/akademik/asesmen", label: "Input Nilai Test", description: "Input nilai satu test untuk satu kelas, cepat.", icon: <IconEdit />, accent: "brand" },
      { to: "/sch/$sekolah/akademik/entri-nilai", label: "Entri Nilai", description: "Rekap nilai per siswa × komponen.", icon: <IconChart />, accent: "sky" },
    ],
  },
  {
    role: "admin",
    blurb: "Setup & konfigurasi yang menopang seluruh penilaian.",
    actions: [
      { to: "/sch/$sekolah/master/kkm", label: "KKM", description: "Atur Kriteria Ketuntasan Minimal.", icon: <IconCheck />, accent: "amber" },
      { to: "/sch/$sekolah/master/komponen-nilai", label: "Komponen Nilai", description: "Definisikan bobot komponen penilaian.", icon: <IconChart />, accent: "violet" },
      { to: "/sch/$sekolah/master/kurikulum", label: "Kurikulum", description: "Kelola kurikulum & struktur mapel.", icon: <IconGrad />, accent: "sky" },
      { to: "/sch/$sekolah/master/konfigurasi", label: "Konfigurasi", description: "Pengaturan modul akademik.", icon: <IconSettings />, accent: "rose" },
    ],
  },
  {
    role: "kepala",
    blurb: "Pantau progres penilaian dan terbitkan raport.",
    actions: [
      { to: "/sch/$sekolah/akademik/raport", label: "Raport", description: "Susun & cetak raport siswa.", icon: <IconFile />, accent: "emerald" },
      { to: "/sch/$sekolah/akademik/entri-nilai", label: "Monitoring Nilai", description: "Pantau kelengkapan nilai per kelas.", icon: <IconChart />, accent: "sky" },
    ],
  },
];

const GUIDE_STEPS = [
  {
    title: "Administrator menyiapkan fondasi",
    detail: "Tetapkan kurikulum aktif, daftar mata pelajaran, KKM, dan komponen nilai. Ini sumber semua perhitungan.",
    roles: ["admin"] as AkademikRole[],
  },
  {
    title: "Guru memasukkan nilai",
    detail: "Pakai Input Nilai Test untuk nilai per ulangan, lalu Entri Nilai untuk rekap per siswa × komponen.",
    roles: ["guru"] as AkademikRole[],
  },
  {
    title: "Kepala Sekolah memantau & menerbitkan",
    detail: "Cek kelengkapan nilai, perhatikan cut-off raport, lalu susun dan cetak raport.",
    roles: ["kepala"] as AkademikRole[],
  },
  {
    title: "Pantau kartu \"Perlu Perhatian\"",
    detail: "Mapel tanpa KKM atau komponen nilai, serta cut-off yang mendekat, muncul di sini agar cepat ditindak.",
  },
];

const GUIDE_TIPS = [
  "Warna kartu: hijau = beres, kuning = perlu dilengkapi, merah = mendesak.",
  "Pilih chip peran di atas untuk menyorot pintasan yang paling relevan untuk Anda.",
];

/** Build KKM coverage segments: mapel dengan vs tanpa KKM. */
function buildKkmCoverage(mapelCount: number, mapelTanpaKkm: number): DistributionSegment[] {
  const dengan = Math.max(0, mapelCount - mapelTanpaKkm);
  return [
    { label: "Sudah ada KKM", value: dengan, tone: "emerald" },
    { label: "Belum ada KKM", value: mapelTanpaKkm, tone: "rose" },
  ];
}

/** Build Komponen-nilai coverage segments: mapel dengan vs tanpa komponen. */
function buildKomponenCoverage(mapelCount: number, komponenCovered: number): DistributionSegment[] {
  const dengan = Math.min(mapelCount, komponenCovered);
  const tanpa = Math.max(0, mapelCount - dengan);
  return [
    { label: "Sudah ada komponen", value: dengan, tone: "violet" },
    { label: "Belum ada komponen", value: tanpa, tone: "amber" },
  ];
}

/** Aggregate mapel counts per kelompok_mapel for the horizontal bar chart. */
function buildKelompokBars(mapelList: Mapel[]): ChartDatum[] {
  const counts = new Map<string, number>();
  for (const m of mapelList) {
    const key = m.kelompok_mapel?.trim() || "Tanpa kelompok";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value, tone: "brand" as const }))
    .sort((a, b) => b.value - a.value)
    .slice(0, HBAR_GROUP_LIMIT);
}

/** Overall setup completeness (0..100) across the four foundation pillars. */
function computeSetupCompleteness(input: {
  mapelCount: number;
  mapelTanpaKkm: number;
  komponenCovered: number;
  kurikulumAktif: number;
}): number {
  const { mapelCount, mapelTanpaKkm, komponenCovered, kurikulumAktif } = input;
  const hasMapel = mapelCount > 0 ? 1 : 0;
  const kkmRatio = mapelCount > 0 ? (mapelCount - mapelTanpaKkm) / mapelCount : 0;
  const komponenRatio = mapelCount > 0 ? Math.min(1, komponenCovered / mapelCount) : 0;
  const hasKurikulum = kurikulumAktif > 0 ? 1 : 0;
  const score = (hasMapel + kkmRatio + komponenRatio + hasKurikulum) / SETUP_PILLAR_COUNT;
  return Math.round(score * PERCENT_MAX);
}

/** Tone for the completeness ring based on the percent achieved. */
function setupTone(pct: number): "emerald" | "amber" | "rose" {
  if (pct >= SETUP_GOOD_PCT) return "emerald";
  if (pct >= SETUP_OK_PCT) return "amber";
  return "rose";
}

function AkademikDashboardPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const ctx = useAkademikContextOptional();
  const role = useAkademikRole();
  const now = useMemo(() => new Date(), []);

  const mapelQ = useResourceList<Mapel>("Mata Pelajaran", {
    fields: MAPEL_FIELDS,
    order_by: "`modified` desc",
    limit_page_length: PAGE_LIMIT,
  });
  const kkmQ = useResourceList<Kkm>("KKM", {
    fields: KKM_FIELDS,
    order_by: "`mata_pelajaran` asc",
    limit_page_length: PAGE_LIMIT,
  });
  const kurikulumQ = useResourceList<Kurikulum>("Kurikulum", {
    fields: KURIKULUM_FIELDS,
    order_by: "`modified` desc",
    limit_page_length: PAGE_LIMIT,
  });
  const komponenQ = useResourceList<Komponen>("Komponen Nilai", {
    fields: KOMPONEN_FIELDS,
    order_by: "`mata_pelajaran` asc",
    limit_page_length: PAGE_LIMIT,
  });
  const taQ = useResourceList<TahunAjaran>("Tahun Ajaran", {
    fields: TA_FIELDS,
    filters: ctx?.tahunAjaran
      ? [["name", "=", ctx.tahunAjaran]]
      : [["is_current", "=", 1]],
    limit_page_length: 1,
  });

  const mapelList = mapelQ.data ?? [];
  const kkmList = kkmQ.data ?? [];
  const kurikulumList = kurikulumQ.data ?? [];
  const komponenList = komponenQ.data ?? [];
  const activeTA = taQ.data?.[0];

  const cutoff = useMemo(() => {
    if (!activeTA) return null;
    const semester = ctx?.semester;
    if (semester === "Genap") return parseDateOrNull(activeTA.semester_genap_akhir);
    if (semester === "Ganjil") return parseDateOrNull(activeTA.semester_ganjil_akhir);
    const ganjil = parseDateOrNull(activeTA.semester_ganjil_akhir);
    const genap = parseDateOrNull(activeTA.semester_genap_akhir);
    const upcoming = [ganjil, genap].filter((d): d is Date => d !== null && d >= now);
    if (upcoming.length === 0) return null;
    return upcoming.sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  }, [activeTA, ctx?.semester, now]);

  // Count of mapel that have at least one komponen nilai (by mapel "name").
  const komponenCovered = useMemo(
    () => new Set(komponenList.map((k) => k.mata_pelajaran).filter(Boolean) as string[]).size,
    [komponenList],
  );

  const stats = useMemo(() => {
    const totalMapel = mapelList.length;
    const mapelDenganKkm = new Set(kkmList.map((k) => k.mata_pelajaran));
    const kkmBelumDiatur = mapelList.filter((m) => !mapelDenganKkm.has(m.name)).length;
    const kurikulumAktif = kurikulumList.filter((k) => k.is_aktif === 1).length;
    return { totalMapel, kkmBelumDiatur, kurikulumAktif };
  }, [mapelList, kkmList, kurikulumList]);

  // Visualization data derived purely from already-fetched lists.
  const kkmCoverage = useMemo(
    () => buildKkmCoverage(stats.totalMapel, stats.kkmBelumDiatur),
    [stats.totalMapel, stats.kkmBelumDiatur],
  );
  const komponenCoverage = useMemo(
    () => buildKomponenCoverage(stats.totalMapel, komponenCovered),
    [stats.totalMapel, komponenCovered],
  );
  const kelompokBars = useMemo(() => buildKelompokBars(mapelList), [mapelList]);
  const setupPercent = useMemo(
    () =>
      computeSetupCompleteness({
        mapelCount: stats.totalMapel,
        mapelTanpaKkm: stats.kkmBelumDiatur,
        komponenCovered,
        kurikulumAktif: stats.kurikulumAktif,
      }),
    [stats.totalMapel, stats.kkmBelumDiatur, stats.kurikulumAktif, komponenCovered],
  );
  const kkmDonut = useMemo<ChartDatum[]>(
    () => kkmCoverage.map((s) => ({ label: s.label, value: s.value, tone: s.tone })),
    [kkmCoverage],
  );

  const cutOffDays = cutoff ? daysUntil(cutoff, now) : null;
  const cutOffUrgency: "normal" | "warn" | "critical" =
    cutOffDays === null
      ? "normal"
      : cutOffDays <= CUTOFF_CRITICAL_DAYS
        ? "critical"
        : cutOffDays <= CUTOFF_WARN_DAYS
          ? "warn"
          : "normal";

  const renderStatLink = (href: string, children: React.ReactNode) => <Link to={href}>{children}</Link>;

  const perluPerhatianItems = useMemo<AttentionItem[]>(() => {
    const kkmSet = new Set(kkmList.map((k) => k.mata_pelajaran));
    const komponenSet = new Set(komponenList.map((k) => k.mata_pelajaran).filter(Boolean));
    const items: AttentionItem[] = [];

    if (cutOffDays !== null && cutOffDays <= CUTOFF_WARN_DAYS) {
      items.push({
        id: "cutoff-raport",
        label: `Cut-off raport dalam ${cutOffDays} hari`,
        description: "Pastikan entri nilai selesai sebelum batas waktu.",
        tone: cutOffDays <= CUTOFF_CRITICAL_DAYS ? "danger" : "warning",
        badge: "Cut-off",
        actionLabel: "Buka Entri Nilai",
        actionHref: "/sch/$sekolah/akademik/entri-nilai",
      });
    }

    for (const m of mapelList) {
      if (items.length >= ATTENTION_CAP) break;
      if (!kkmSet.has(m.name)) {
        items.push({
          id: `kkm-${m.name}`,
          label: m.nama_mapel,
          description: `${m.kode_mapel} · belum ada KKM`,
          tone: "danger",
          badge: "KKM",
          actionLabel: "Atur KKM",
          actionHref: "/sch/$sekolah/master/kkm",
        });
      }
      if (items.length >= ATTENTION_CAP) break;
      if (!komponenSet.has(m.name)) {
        items.push({
          id: `komponen-${m.name}`,
          label: m.nama_mapel,
          description: `${m.kode_mapel} · belum ada komponen nilai`,
          tone: "warning",
          badge: "Komponen",
          actionLabel: "Atur Komponen",
          actionHref: "/sch/$sekolah/master/komponen-nilai",
        });
      }
    }
    return items;
  }, [mapelList, kkmList, komponenList, cutOffDays]);

  const aktivitasTerbaru = mapelList.slice(0, RECENT_LIMIT);

  const anyLoading =
    mapelQ.isLoading || kkmQ.isLoading || kurikulumQ.isLoading || komponenQ.isLoading;
  const anyError =
    mapelQ.isError || kkmQ.isError || kurikulumQ.isError || komponenQ.isError;
  const refetchAll = () => {
    void mapelQ.refetch();
    void kkmQ.refetch();
    void kurikulumQ.refetch();
    void komponenQ.refetch();
    void taQ.refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik"
        title="Dashboard Akademik"
        description={
          <>
            Pusat kendali penilaian untuk Administrator, Guru, dan Kepala Sekolah —
            ringkasan mapel, <GlossaryTooltip term="KKM" definition={GLOSSARY.KKM} />,
            kurikulum, dan progres penilaian.
          </>
        }
      />

      <PageGuide
        storageId="dashboard"
        intro="Halaman ini menyatukan tiga peran dalam satu alur penilaian. Ikuti langkah sesuai peran Anda."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <RoleChips primary={role.primary} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cut-off Raport"
          value={cutOffDays !== null ? `${cutOffDays} hari` : "—"}
          hint={
            cutoff
              ? `tersisa s/d ${cutoff.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
              : "TA aktif belum punya semester_*_akhir"
          }
          icon={<IconBook />}
          accent="brand"
          urgency={cutOffUrgency}
        />
        <StatCard
          label={
            <>
              <GlossaryTooltip term="KKM" definition={GLOSSARY.KKM} /> Belum Diatur
            </>
          }
          value={stats.kkmBelumDiatur.toLocaleString("id-ID")}
          hint="mapel tanpa KKM"
          icon={<IconAlert />}
          accent="amber"
          urgency="warn"
          actionHref="/sch/$sekolah/master/kkm"
          renderLink={renderStatLink}
        />
        <StatCard
          label="Kurikulum Aktif"
          value={stats.kurikulumAktif.toLocaleString("id-ID")}
          hint={`dari ${kurikulumList.length} total`}
          icon={<IconGrad />}
          accent="emerald"
          urgency="normal"
        />
        <StatCard
          label="% Sel Nilai Terisi"
          value="—"
          hint="Belum tersedia · butuh endpoint progres entri nilai"
          icon={<IconEdit />}
          accent="violet"
          urgency="normal"
          actionHref="/sch/$sekolah/akademik/entri-nilai"
          renderLink={renderStatLink}
        />
      </div>

      <SectionCard
        title="Kesiapan Setup Akademik"
        description="Gambaran fondasi penilaian dari data yang sudah ada — tanpa endpoint baru."
      >
        {anyLoading ? (
          <VizSkeleton />
        ) : anyError ? (
          <ErrorRetry onRetry={refetchAll} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <VizTile title="Kesiapan keseluruhan" hint="Mapel, KKM, komponen, kurikulum">
              <ProgressRing value={setupPercent} tone={setupTone(setupPercent)} label="setup beres" />
            </VizTile>
            <VizTile title="Cakupan KKM" hint={`${stats.totalMapel} mapel`}>
              <DonutChart
                data={kkmDonut}
                centerTop={<span className="text-lg font-semibold text-fg">{stats.totalMapel}</span>}
                centerBottom={<span className="text-[11px] text-muted-fg">mapel</span>}
              />
            </VizTile>
            <VizTile title="Cakupan Komponen Nilai" hint="mapel dengan vs tanpa komponen">
              <DistributionBar segments={komponenCoverage} />
            </VizTile>
            <VizTile title="Mapel per Kelompok" hint="distribusi kelompok mapel">
              {kelompokBars.length > 0 ? (
                <HBarChart data={kelompokBars} className="w-full" />
              ) : (
                <div className="text-xs text-muted-fg">Belum ada data mapel.</div>
              )}
            </VizTile>
          </div>
        )}
      </SectionCard>

      <ModuleFlow
        title="Alur Penilaian Akademik"
        description="Langkah dari setup kurikulum sampai raport terbit."
        steps={AKADEMIK_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/sch/$sekolah/master/kurikulum"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

      <SectionCard
        title="Aksi Cepat per Peran"
        description="Pintasan dikelompokkan per peran. Kelompok peran utama Anda disorot."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {QUICK_ACTION_GROUPS.map((g) => (
            <QuickActionGroupCard key={g.role} group={g} emphasized={g.role === role.primary} />
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Perlu Perhatian"
          description="Mapel tanpa KKM, komponen nilai, atau cut-off raport dekat."
          action={
            perluPerhatianItems.length > 0 ? (
              <Badge tone="warning">{perluPerhatianItems.length} item</Badge>
            ) : null
          }
        >
          {anyLoading ? (
            <PerhatianSkeleton />
          ) : anyError ? (
            <ErrorRetry onRetry={refetchAll} />
          ) : (
            <AttentionList
              items={perluPerhatianItems}
              maxItems={5}
              renderLink={(href, children, className) => (
                <Link to={href} className={className}>
                  {children}
                </Link>
              )}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Aktivitas Terbaru"
          description="Mata pelajaran terakhir diperbarui."
          action={
            <Link to="/sch/$sekolah/master/mapel" params={{ sekolah }} className="text-xs text-brand hover:underline">
              Lihat semua
            </Link>
          }
        >
          {anyLoading ? (
            <PerhatianSkeleton />
          ) : anyError ? (
            <ErrorRetry onRetry={refetchAll} />
          ) : aktivitasTerbaru.length === 0 ? (
            <div className="text-sm text-muted-fg">Belum ada mata pelajaran.</div>
          ) : (
            <ul className="divide-y divide-border -my-2">
              {aktivitasTerbaru.map((m) => (
                <li key={m.name} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-fg truncate">{m.nama_mapel}</div>
                    <div className="text-xs text-muted-fg">
                      <span className="font-mono">{m.kode_mapel}</span>
                      {m.kelompok_mapel ? ` · ${m.kelompok_mapel}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/** Read-only role chips highlighting the active primary role (framing only). */
function RoleChips({ primary }: { primary: AkademikRole }) {
  const roles: AkademikRole[] = ["admin", "guru", "kepala"];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-fg inline-flex items-center gap-1.5">
        <span className="h-4 w-4 text-muted-fg">
          <IconUsers />
        </span>
        Tampilan untuk:
      </span>
      {roles.map((r) => (
        <span
          key={r}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition",
            r === primary
              ? "border-brand bg-brand/10 text-brand"
              : "border-border bg-bg text-muted-fg",
          )}
        >
          {ROLE_LABEL[r]}
        </span>
      ))}
    </div>
  );
}

/** A titled tile wrapping a single visualization with a caption. */
function VizTile({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-bg p-4">
      <div className="w-full text-center">
        <div className="text-sm font-medium text-fg">{title}</div>
        {hint ? <div className="text-[11px] text-muted-fg">{hint}</div> : null}
      </div>
      <div className="flex w-full flex-1 items-center justify-center">{children}</div>
    </div>
  );
}

/** One role-framed quick-action group; emphasized when it matches the role. */
function QuickActionGroupCard({
  group,
  emphasized,
}: {
  group: QuickActionGroup;
  emphasized: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition",
        emphasized ? "border-brand bg-brand/5 shadow-sm" : "border-border bg-bg",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-fg">Untuk {ROLE_LABEL[group.role]}</div>
        {emphasized ? <Badge tone="brand">Peran Anda</Badge> : null}
      </div>
      <p className="mb-3 text-xs text-muted-fg">{group.blurb}</p>
      <div className="space-y-2">
        {group.actions.map((a) => (
          <Link
            key={`${group.role}-${a.label}`}
            to={a.to}
            className="group flex items-start gap-3 rounded-lg border border-border bg-bg p-3 hover:border-brand hover:shadow-sm transition"
          >
            <div className="h-8 w-8 shrink-0 rounded-md bg-muted flex items-center justify-center text-fg group-hover:text-brand">
              <span className="h-4 w-4">{a.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-fg group-hover:text-brand">{a.label}</div>
              <div className="text-xs text-muted-fg mt-0.5">{a.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function VizSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-pulse" aria-hidden>
      {Array.from({ length: SETUP_PILLAR_COUNT }).map((_, i) => (
        <div key={i} className="h-40 rounded-lg bg-muted" />
      ))}
    </div>
  );
}

function PerhatianSkeleton() {
  return (
    <div className="space-y-2 animate-pulse" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-9 rounded bg-muted" />
      ))}
    </div>
  );
}

function ErrorRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
      <div className="text-sm text-rose-700">Gagal memuat data.</div>
      <Button variant="outline" onClick={onRetry}>
        Coba lagi
      </Button>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/")({ component: AkademikDashboardPage });
