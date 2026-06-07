/**
 * Keuangan hub landing — the "Alur Uang" cockpit.
 *
 * Work-first order (daily accountant weighted 70%): an urgency-ranked work-queue
 * sits ON TOP, then the 5-stage money-flow pipeline ribbon, then the conditional
 * "Saat Ini Penting" deadline strip, then the existing visualisation band, an
 * onboarding guide, and a footer quick-create row. Roles drive EMPHASIS only.
 * Backed by the live vernon_accounting keuangan doctypes via ../data/keuangan-live
 * plus the SPT draft count from akuntansi. No financial document is mutated here.
 */
import { useMemo, useState } from "react";
import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import {
  Badge,
  PageHeader,
  SectionCard,
  StatCard,
  IconWallet,
  IconChart,
  IconAlert,
  IconArrowLeft,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  LineChart,
  StackedBarChart,
  DonutChart,
  HBarChart,
  GaugeChart,
  WaterfallChart,
  type ChartDatum,
  type StackGroup,
  type Tone,
} from "../components/viz";
import {
  KeuanganRoleChips,
  KeuanganPageGuide,
  WorkQueueCard,
  PipelineRibbon,
  DeadlineStrip,
  QuickCreateRow,
  TutupBulanPanel,
  type RibbonStage,
  type QuickCreate,
  type CloseStep,
  type CloseStatus,
} from "../components/keuangan";
import { useKeuanganRole, type KeuanganRole } from "../lib/keuanganRole";
import { useActiveCompany } from "../lib/akuntansi-scope";
import { buildWorkQueue } from "../lib/keuanganWorkQueue";
import { computeDeadlines } from "../lib/keuanganCalendar";
import { formatRupiah, type KategoriPengeluaran } from "../data/keuangan";
import { DOCTYPE, type SptMasaPPN, type JournalEntry } from "../data/akuntansi";
import {
  useTagihanLive,
  usePembayaranLive,
  usePengeluaranLive,
  useKasLive,
  aggregateMonthly,
} from "../data/keuangan-live";

/** Today as an ISO yyyy-mm-dd prefix, used to scope deadlines + the work-queue. */
const TODAY = new Date().toISOString().slice(0, 10);

/** Current month as a yyyy-mm prefix, used to scope "bulan ini" KPIs. */
const CURRENT_MONTH_PREFIX = TODAY.slice(0, 7);

/** Tone palette for expense categories (stable, max 7). */
const KATEGORI_TONE: Record<KategoriPengeluaran, Tone> = {
  Operasional: "brand",
  Gaji: "violet",
  "Sarana Prasarana": "sky",
  Kegiatan: "amber",
  ATK: "emerald",
  Utilitas: "rose",
  Lainnya: "neutral",
};

/** Which pipeline stage to elevate for the active role (emphasis only). */
const ROLE_STAGE: Record<KeuanganRole, RibbonStage["key"]> = {
  kasir: "terima",
  bendahara: "tagih",
  akuntan: "catat",
  kepala: "tutup-buku",
};

/** Footer quick-create actions (highest-frequency "buat baru"). */
const QUICK_CREATE: readonly QuickCreate[] = [
  { label: "Terima Bayar", to: "/sch/$sekolah/keuangan/pembayaran" },
  { label: "Tagihan Baru", to: "/sch/$sekolah/keuangan/tagihan" },
  { label: "Jurnal Baru", to: "/sch/$sekolah/akuntansi/buku-besar/jurnal/new" },
  { label: "Pengeluaran", to: "/sch/$sekolah/keuangan/pengeluaran" },
];

/** Routes for each month-end close step. */
const CLOSE_ROUTE = {
  kas: "/sch/$sekolah/keuangan/kas",
  jurnal: "/sch/$sekolah/akuntansi/buku-besar/jurnal",
  tagihan: "/sch/$sekolah/keuangan/tagihan",
  sptPpn: "/sch/$sekolah/akuntansi/pajak/spt-ppn",
  period: "/sch/$sekolah/akuntansi/referensi/period",
} as const;

/** Derive a warn/done status from an outstanding count. */
function warnIf(count: number, doneLabel: string, warnLabel: string): { status: CloseStatus; statusLabel: string } {
  return count > 0 ? { status: "warn", statusLabel: warnLabel } : { status: "done", statusLabel: doneLabel };
}

/** Build the ordered month-end close checklist from outstanding counts. */
function buildCloseSteps(p: { unpaidTagihan: number; draftJournals: number; sptDraft: number }): CloseStep[] {
  return [
    { label: "Rekonsiliasi Buku Kas", hint: "Cocokkan saldo kas fisik dengan catatan", to: CLOSE_ROUTE.kas, status: "todo", statusLabel: "tinjau" },
    { label: "Tinjau Jurnal Belum Posting", hint: "Pastikan semua jurnal sudah diposting", to: CLOSE_ROUTE.jurnal, ...warnIf(p.draftJournals, "beres", `${p.draftJournals} draft`) },
    { label: "Tinjau Tagihan Terbuka", hint: "Tindak lanjuti tunggakan sebelum tutup", to: CLOSE_ROUTE.tagihan, ...warnIf(p.unpaidTagihan, "lunas", `${p.unpaidTagihan} terbuka`) },
    { label: "Lapor SPT Masa PPN", hint: "Selesaikan SPT draft", to: CLOSE_ROUTE.sptPpn, ...warnIf(p.sptDraft, "terlapor", `${p.sptDraft} draft`) },
    { label: "Tutup Periode", hint: "Kunci periode akuntansi setelah semua beres", to: CLOSE_ROUTE.period, status: "todo", statusLabel: "kunci" },
  ];
}

/** Pipeline ribbon spec: one KPI + waiting-count per stage, role stage elevated. */
interface RibbonInput {
  tagihanTerbuka: number;
  pemasukanBulan: number;
  pengeluaranBulan: number;
  sptDraft: number;
  tagihCount: number;
  belanjaCount: number;
  closeDaysLeft: number;
  activeRole: KeuanganRole;
}

/** Build the 5 pipeline stage cards from the aggregated KPIs. */
function buildRibbonStages(p: RibbonInput): RibbonStage[] {
  const emph = ROLE_STAGE[p.activeRole];
  return [
    { key: "tagih", label: "Tagih", to: "/sch/$sekolah/keuangan/tagihan", kpi: formatRupiah(p.tagihanTerbuka), kpiLabel: "tagihan terbuka", count: p.tagihCount, emphasized: emph === "tagih" },
    { key: "terima", label: "Terima", to: "/sch/$sekolah/keuangan/pembayaran", kpi: formatRupiah(p.pemasukanBulan), kpiLabel: "masuk bulan ini", count: 0, emphasized: emph === "terima" },
    { key: "catat", label: "Catat", to: "/sch/$sekolah/keuangan/pengeluaran", kpi: formatRupiah(p.pengeluaranBulan), kpiLabel: "keluar bulan ini", count: p.belanjaCount, emphasized: emph === "catat" },
    { key: "tutup-buku", label: "Tutup Buku", to: "/sch/$sekolah/akuntansi/anggaran", kpi: `H-${Math.max(0, p.closeDaysLeft)}`, kpiLabel: "menuju tutup buku", count: 0, emphasized: emph === "tutup-buku" },
    { key: "lapor-pajak", label: "Lapor Pajak", to: "/sch/$sekolah/akuntansi/pajak/spt-ppn", kpi: String(p.sptDraft), kpiLabel: "SPT draft", count: p.sptDraft, emphasized: emph === "lapor-pajak" },
  ];
}

/** Role-scoped guide steps shown in the dashboard tutorial (pipeline framing). */
const GUIDE_STEPS = [
  { title: "Baca alurnya: Tagih → Terima → Catat → Tutup Buku → Lapor Pajak", detail: "Menu mengikuti perjalanan uang sekolah. Mulai dari kiri, lanjut ke kanan." },
  { title: "Kasir: Terima", detail: "Catat pelunasan SPP/biaya di Terima, lalu rekonsiliasi di Buku Kas tiap akhir hari.", roles: ["kasir"] },
  { title: "Bendahara: Tagih & Catat", detail: "Terbitkan Tagihan, setujui Pengeluaran. 'Pekerjaan Hari Ini' menampilkan yang menunggu Anda.", roles: ["bendahara"] },
  { title: "Akuntan: Catat & Lapor Pajak", detail: "Posting jurnal ke buku besar, lalu kelola SPT PPN/PPh di Lapor Pajak.", roles: ["akuntan"] },
  { title: "Kepala Sekolah: Tutup Buku", detail: "Pantau serapan anggaran dan tutup periode. Setujui pengeluaran besar.", roles: ["kepala"] },
];

const GUIDE_TIPS = [
  "Pilih chip peran di atas untuk menaikkan pekerjaan Anda ke puncak antrean.",
  "Tekan ⌘K kapan saja untuk melompat ke halaman atau aksi mana pun.",
];

function KeuanganDashboard() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const company = useActiveCompany();
  const role = useKeuanganRole();
  const [activeRole, setActiveRole] = useState<KeuanganRole>(role.primary);

  const { rows: tagihan } = useTagihanLive();
  const { rows: pembayaran } = usePembayaranLive();
  const { rows: pengeluaran } = usePengeluaranLive();
  const { rows: kas } = useKasLive();

  const sptQ = useResourceList<SptMasaPPN>(DOCTYPE.SPT_MASA_PPN, {
    fields: ["name", "status"],
    filters: company ? [["company", "=", company]] : [],
    limit_page_length: 0,
  });
  const sptDraft = useMemo(
    () => (sptQ.data ?? []).filter((s) => (s.status ?? "Draft") === "Draft").length,
    [sptQ.data],
  );

  const journalDraftQ = useResourceList<JournalEntry>(DOCTYPE.JOURNAL_ENTRY, {
    fields: ["name", "docstatus"],
    filters: company ? [["docstatus", "=", 0], ["company", "=", company]] : [["docstatus", "=", 0]],
    limit_page_length: 0,
  });
  const draftJournals = journalDraftQ.data?.length ?? 0;

  /** Month-end close: are we in close mode (?close=1)? */
  const { close } = Route.useSearch();
  const unpaidTagihan = useMemo(
    () => tagihan.filter((t) => t.status !== "Lunas" && t.status !== "Dibatalkan" && t.jumlah - t.dibayar > 0).length,
    [tagihan],
  );
  const closeSteps = useMemo(
    () => buildCloseSteps({ unpaidTagihan, draftJournals, sptDraft }),
    [unpaidTagihan, draftJournals, sptDraft],
  );

  /** Monthly income/expense rollup from live rows (chronological). */
  const ringkasan = useMemo(() => aggregateMonthly(pembayaran, pengeluaran), [pembayaran, pengeluaran]);

  /** 12-month cash trend (income vs expense) line series. */
  const trend = useMemo(() => {
    const recent = ringkasan.slice(-12);
    return {
      masuk: recent.map((r) => r.pemasukan),
      keluar: recent.map((r) => r.pengeluaran),
      labels: recent.map((r) => r.bulan),
    };
  }, [ringkasan]);

  const stats = useMemo(() => {
    const last = kas[kas.length - 1];
    const saldoKas = last?.saldoAkhir ?? 0;
    const pemasukanBulan = pembayaran
      .filter((p) => p.tanggal.startsWith(CURRENT_MONTH_PREFIX))
      .reduce((s, p) => s + p.jumlah, 0);
    const pengeluaranBulan = pengeluaran
      .filter((p) => p.tanggal.startsWith(CURRENT_MONTH_PREFIX) && p.status === "Dibayar")
      .reduce((s, p) => s + p.jumlah, 0);
    const totalTagih = tagihan.reduce((s, t) => s + t.jumlah, 0);
    const totalDibayar = tagihan.reduce((s, t) => s + t.dibayar, 0);
    const tagihanTerbuka = totalTagih - totalDibayar;
    const collectionRate = totalTagih > 0 ? (totalDibayar / totalTagih) * 100 : 0;
    return { saldoKas, pemasukanBulan, pengeluaranBulan, tagihanTerbuka, collectionRate };
  }, [tagihan, pembayaran, pengeluaran, kas]);

  /** Deadlines (statutory, date-only fallback) for the "Saat Ini Penting" strip. */
  const deadlines = useMemo(() => computeDeadlines(TODAY), []);
  const closeDaysLeft = deadlines.find((d) => d.id === "tutup-buku")?.daysLeft ?? 0;

  /** Urgency-ranked work-queue, role-floated to the top. */
  const workItems = useMemo(
    () => buildWorkQueue({ tagihan, pengeluaran, sptDraftCount: sptDraft, today: TODAY, role: activeRole }),
    [tagihan, pengeluaran, sptDraft, activeRole],
  );
  const tagihCount = workItems.filter((i) => i.type === "tagihan").length;
  const belanjaCount = workItems.filter((i) => i.type === "belanja").length;

  const ribbonStages = useMemo(
    () =>
      buildRibbonStages({
        tagihanTerbuka: stats.tagihanTerbuka,
        pemasukanBulan: stats.pemasukanBulan,
        pengeluaranBulan: stats.pengeluaranBulan,
        sptDraft,
        tagihCount,
        belanjaCount,
        closeDaysLeft,
        activeRole,
      }),
    [stats, sptDraft, tagihCount, belanjaCount, closeDaysLeft, activeRole],
  );

  /** Expense composition by category (donut). */
  const kategoriDonut = useMemo<ChartDatum[]>(() => {
    const totals = new Map<KategoriPengeluaran, number>();
    for (const p of pengeluaran) {
      totals.set(p.kategori, (totals.get(p.kategori) ?? 0) + p.jumlah);
    }
    return [...totals.entries()]
      .map(([kategori, value]) => ({ label: kategori, value, tone: KATEGORI_TONE[kategori] }))
      .sort((a, b) => b.value - a.value);
  }, [pengeluaran]);

  /** Income vs expense stacked bars over the last 6 months. */
  const monthlyStacks = useMemo<StackGroup[]>(
    () =>
      ringkasan.slice(-6).map((r) => ({
        label: r.bulan,
        segments: [
          { value: r.pemasukan, tone: "emerald" as Tone },
          { value: r.pengeluaran, tone: "rose" as Tone },
        ],
      })),
    [ringkasan],
  );

  /** Top 6 overdue bills (HBar + attention list). */
  const topTunggakan = useMemo(
    () =>
      [...tagihan]
        .filter((t) => t.status !== "Lunas" && t.status !== "Dibatalkan")
        .map((t) => ({ ...t, sisa: t.jumlah - t.dibayar }))
        .sort((a, b) => b.sisa - a.sisa)
        .slice(0, 6),
    [tagihan],
  );

  const tunggakanBars = useMemo<ChartDatum[]>(
    () => topTunggakan.map((t) => ({ label: t.siswa, value: t.sisa, tone: "rose" as Tone })),
    [topTunggakan],
  );

  /** Cash waterfall for the current month. */
  const waterfallSteps = useMemo(
    () => [
      { label: "Masuk", delta: stats.pemasukanBulan, tone: "emerald" as Tone },
      { label: "Keluar", delta: -stats.pengeluaranBulan, tone: "rose" as Tone },
    ],
    [stats.pemasukanBulan, stats.pengeluaranBulan],
  );

  const saldoAwalBulan = useMemo(() => {
    const last = kas[kas.length - 1];
    return (last?.saldoAkhir ?? 0) - stats.pemasukanBulan + stats.pengeluaranBulan;
  }, [kas, stats.pemasukanBulan, stats.pengeluaranBulan]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Alur Uang"
        description="Tagih → Terima → Catat → Tutup Buku → Lapor Pajak. Semua yang menunggu Anda ada di Pekerjaan Hari Ini."
        actions={
          <Link
            to="/sch/$sekolah/keuangan"
            params={{ sekolah }}
            search={{ close: 1 }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:border-brand hover:bg-brand/5"
          >
            Tutup Bulan
          </Link>
        }
      />

      <KeuanganRoleChips active={activeRole} onSelect={setActiveRole} />

      {/* Month-end close mode (?close=1): surface the close checklist on top. */}
      {close === 1 ? <TutupBulanPanel steps={closeSteps} sekolah={sekolah} /> : null}

      {/* ROW 1 — work-first: today's actionable queue on top. */}
      <WorkQueueCard items={workItems} sekolah={sekolah} />

      {/* ROW 2 — the money-flow pipeline. */}
      <PipelineRibbon stages={ribbonStages} sekolah={sekolah} />

      {/* ROW 3 — conditional deadline nudge (collapses when idle). */}
      <DeadlineStrip deadlines={deadlines} sekolah={sekolah} />

      {/* ROW 4 — KPIs + the existing visualisation band, re-homed under the cockpit. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo Kas" value={formatRupiah(stats.saldoKas)} accent="brand" icon={<IconWallet />} />
        <StatCard label="Pemasukan Bulan Ini" value={formatRupiah(stats.pemasukanBulan)} accent="emerald" icon={<IconChart />} />
        <StatCard label="Pengeluaran Bulan Ini" value={formatRupiah(stats.pengeluaranBulan)} accent="rose" icon={<IconArrowLeft />} />
        <StatCard label="Tagihan Terbuka" value={formatRupiah(stats.tagihanTerbuka)} accent="amber" icon={<IconAlert />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Tren Arus Kas 12 Bulan"
          description="Pemasukan vs pengeluaran sepanjang tahun berjalan"
          className="xl:col-span-2"
        >
          <LineChart
            ariaLabel="Tren pemasukan dan pengeluaran 12 bulan"
            height={140}
            xLabels={trend.labels}
            series={[
              { label: "Pemasukan", tone: "emerald", points: trend.masuk },
              { label: "Pengeluaran", tone: "rose", points: trend.keluar },
            ]}
          />
        </SectionCard>

        <SectionCard title="Tingkat Penagihan" description="Porsi tagihan yang sudah terbayar">
          <div className="flex flex-col items-center gap-2">
            <GaugeChart
              ariaLabel="Tingkat penagihan"
              value={stats.collectionRate}
              tone={stats.collectionRate >= 80 ? "emerald" : stats.collectionRate >= 50 ? "amber" : "rose"}
              label="tagihan terbayar"
            />
            <p className="text-center text-xs text-muted-fg">
              {formatRupiah(stats.tagihanTerbuka)} masih harus ditagih
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Pemasukan vs Pengeluaran" description="6 bulan terakhir">
          <StackedBarChart ariaLabel="Pemasukan vs pengeluaran 6 bulan terakhir" groups={monthlyStacks} />
        </SectionCard>

        <SectionCard title="Komposisi Pengeluaran" description="Berdasarkan kategori">
          <div className="flex justify-center">
            <DonutChart
              data={kategoriDonut}
              centerTop={<span className="text-base font-semibold text-fg">{kategoriDonut.length}</span>}
              centerBottom={<span className="text-[11px] text-muted-fg">kategori</span>}
            />
          </div>
        </SectionCard>

        <SectionCard title="Arus Kas Bulan Ini" description={`Saldo awal ${formatRupiah(saldoAwalBulan)}`}>
          <WaterfallChart ariaLabel="Arus kas bulan ini" start={saldoAwalBulan} steps={waterfallSteps} />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Top Tunggakan" description="Tagihan tertunggak terbesar">
          <HBarChart data={tunggakanBars} valueFormatter={formatRupiah} className="w-full" />
        </SectionCard>

        <SectionCard title="Perlu Perhatian" description="Tindak lanjut tunggakan" padded={false}>
          <ul className="divide-y divide-border">
            {topTunggakan.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{t.siswa}</div>
                  <div className="truncate text-xs text-muted-fg">{t.kelas} · {t.judul}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{formatRupiah(t.sisa)}</div>
                  <Badge tone={t.status === "Jatuh Tempo" ? "danger" : "warning"} dot>{t.status}</Badge>
                </div>
              </li>
            ))}
            {topTunggakan.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-muted-fg">Tidak ada tunggakan. 🎉</li>
            ) : null}
          </ul>
        </SectionCard>
      </div>

      {/* Onboarding guide (collapsible) + footer quick-create. */}
      <KeuanganPageGuide
        storageId="dashboard"
        intro="Hub ini menyatukan operasional kas harian dan akuntansi dalam satu alur uang. Ikuti langkah sesuai peran Anda."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <QuickCreateRow actions={QUICK_CREATE} sekolah={sekolah} />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan/")({
  validateSearch: (search: Record<string, unknown>): { close?: 1 } =>
    search.close === 1 || search.close === "1" ? { close: 1 } : {},
  component: KeuanganDashboard,
});
