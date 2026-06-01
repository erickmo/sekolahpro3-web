/**
 * Operasional › Buku Kas (daily cash book).
 *
 * Kasir/Bendahara reconcile daily cash flow. Adds a role guide, a closing-balance
 * trend line, and in/out KPIs over the existing ledger table. Mock-backed.
 */
import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  type Column,
  DataTable,
  PageHeader,
  SectionCard,
  StatCard,
  IconCheck,
  IconArrowLeft,
  IconWallet,
  IconCalendar,
} from "@sekolahpro/ui";
import { LineChart, StackedBarChart, type StackGroup, type Tone } from "../components/viz";
import { KeuanganPageGuide } from "../components/keuangan";
import { listKasForSekolah, formatRupiah, formatTanggal, type KasRow } from "../data/keuangan";

const GUIDE_STEPS = [
  { title: "Catat kas harian", detail: "Setiap hari, saldo akhir = saldo awal + masuk - keluar. Sistem menghitung otomatis.", roles: ["kasir"] },
  { title: "Rekonsiliasi fisik", detail: "Cocokkan saldo akhir dengan uang kas fisik. Selisih harus segera ditelusuri.", roles: ["kasir", "bendahara"] },
  { title: "Tutup buku", detail: "Saldo akhir hari ini menjadi saldo awal besok. Pantau tren agar kas tidak minus.", roles: ["bendahara"] },
];

function KasPage() {
  const { sekolah } = Route.useParams();
  const kasList = useMemo(() => listKasForSekolah(sekolah), [sekolah]);

  const totals = useMemo(() => {
    const masuk = kasList.reduce((s, k) => s + k.masuk, 0);
    const keluar = kasList.reduce((s, k) => s + k.keluar, 0);
    const last = kasList[kasList.length - 1];
    return { masuk, keluar, saldoAkhir: last?.saldoAkhir ?? 0, hari: kasList.length };
  }, [kasList]);

  const recent = useMemo(() => kasList.slice(-14), [kasList]);

  const saldoTrend = useMemo(() => recent.map((k) => k.saldoAkhir), [recent]);
  const trendLabels = useMemo(() => recent.map((k) => formatTanggal(k.tanggal)), [recent]);

  const flowBars = useMemo<StackGroup[]>(
    () =>
      recent.slice(-7).map((k) => ({
        label: formatTanggal(k.tanggal).slice(0, 5),
        segments: [
          { value: k.masuk, tone: "emerald" as Tone },
          { value: k.keluar, tone: "rose" as Tone },
        ],
      })),
    [recent],
  );

  const cols: Column<KasRow>[] = [
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "saldoAwal", header: "Saldo Awal", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{formatRupiah(r.saldoAwal)}</span> },
    { key: "masuk", header: "Masuk", align: "right", cell: (r) => <span className="tabular-nums text-emerald-600 font-medium">{formatRupiah(r.masuk)}</span> },
    { key: "keluar", header: "Keluar", align: "right", cell: (r) => <span className="tabular-nums text-rose-600 font-medium">{formatRupiah(r.keluar)}</span> },
    { key: "saldoAkhir", header: "Saldo Akhir", align: "right", cell: (r) => <span className="tabular-nums font-semibold">{formatRupiah(r.saldoAkhir)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional"
        title="Buku Kas Harian"
        description="Rekonsiliasi arus kas masuk dan keluar setiap hari."
      />

      <KeuanganPageGuide storageId="kas" steps={GUIDE_STEPS} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Masuk" value={formatRupiah(totals.masuk)} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Total Keluar" value={formatRupiah(totals.keluar)} accent="rose" icon={<IconArrowLeft />} />
        <StatCard label="Saldo Akhir" value={formatRupiah(totals.saldoAkhir)} accent="brand" icon={<IconWallet />} />
        <StatCard label="Hari Tercatat" value={totals.hari} accent="violet" icon={<IconCalendar />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Tren Saldo Akhir" description="14 hari terakhir" className="xl:col-span-2">
          <LineChart
            ariaLabel="Tren saldo akhir kas 14 hari terakhir"
            xLabels={trendLabels}
            series={[{ label: "Saldo Akhir", tone: "brand", points: saldoTrend }]}
          />
        </SectionCard>
        <SectionCard title="Masuk vs Keluar" description="7 hari terakhir">
          <StackedBarChart ariaLabel="Kas masuk vs keluar 7 hari terakhir" groups={flowBars} />
        </SectionCard>
      </div>

      <SectionCard title={`Buku Kas Harian — ${kasList.length} entri`} padded={false}>
        <DataTable data={kasList} columns={cols} rowKey={(r) => r.tanggal} />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan/kas")({ component: KasPage });
