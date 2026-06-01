/**
 * Keuangan hub dashboard — the finance command center.
 *
 * Role-aware (Bendahara / Kasir / Akuntan / Kepala), heavy on visualization:
 * cash trend, income-vs-expense, expense composition, collection gauge, cash
 * waterfall, and an overdue-bills attention list. Mock-backed until the
 * vernon_accounting keuangan doctypes land (see ../data/keuangan).
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { KeuanganRoleChips, KeuanganPageGuide } from "../components/keuangan";
import { useKeuanganRole, type KeuanganRole } from "../lib/keuanganRole";
import {
  listTagihanForSekolah,
  listPembayaranForSekolah,
  listPengeluaranForSekolah,
  listKasForSekolah,
  RINGKASAN_BULAN,
  formatRupiah,
  type KategoriPengeluaran,
} from "../data/keuangan";

const CURRENT_MONTH_PREFIX = "2026-05";

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

/** Role-scoped guide steps shown in the dashboard tutorial. */
const GUIDE_STEPS = [
  { title: "Kasir menerima pembayaran", detail: "Catat pelunasan SPP/biaya di Pembayaran, lalu rekonsiliasi di Buku Kas tiap akhir hari.", roles: ["kasir"] },
  { title: "Bendahara mengelola tagihan & belanja", detail: "Terbitkan Tagihan, setujui Pengeluaran, pantau tunggakan di kartu 'Perlu Perhatian'.", roles: ["bendahara"] },
  { title: "Akuntan memposting ke buku besar", detail: "Setiap transaksi mengalir ke Akuntansi › Buku Besar (jurnal & GL). Pajak dikelola di sub-menu Pajak.", roles: ["akuntan"] },
  { title: "Kepala Sekolah memantau & menyetujui", detail: "Lihat tren kas, tingkat penagihan, dan serapan anggaran. Setujui pengeluaran besar.", roles: ["kepala"] },
  { title: "Warna = status", detail: "Hijau = sehat/masuk, merah = keluar/mendesak, kuning = perlu tindakan." },
];

const GUIDE_TIPS = [
  "Pilih chip peran di atas untuk menyorot pintasan paling relevan untuk Anda.",
  "Angka pada kartu memakai data bulan berjalan; grafik tren memakai 12 bulan.",
];

/** Build the 12-month cash trend (income vs expense) line series. */
function useCashTrend() {
  return useMemo(() => {
    const masuk = RINGKASAN_BULAN.map((r) => r.pemasukan);
    const keluar = RINGKASAN_BULAN.map((r) => r.pengeluaran);
    const labels = RINGKASAN_BULAN.map((r) => r.bulan);
    return { masuk, keluar, labels };
  }, []);
}

function KeuanganDashboard() {
  const { sekolah } = Route.useParams();
  const role = useKeuanganRole();
  const [activeRole, setActiveRole] = useState<KeuanganRole>(role.primary);

  const tagihan = useMemo(() => listTagihanForSekolah(sekolah), [sekolah]);
  const pembayaran = useMemo(() => listPembayaranForSekolah(sekolah), [sekolah]);
  const pengeluaran = useMemo(() => listPengeluaranForSekolah(sekolah), [sekolah]);
  const kas = useMemo(() => listKasForSekolah(sekolah), [sekolah]);
  const trend = useCashTrend();

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
      RINGKASAN_BULAN.slice(-6).map((r) => ({
        label: r.bulan,
        segments: [
          { value: r.pemasukan, tone: "emerald" as Tone },
          { value: r.pengeluaran, tone: "rose" as Tone },
        ],
      })),
    [],
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
        title="Pusat Kendali Keuangan"
        description="Pantau arus kas, tagihan, dan belanja sekolah dalam satu layar."
      />

      <KeuanganRoleChips active={activeRole} onSelect={setActiveRole} />

      <KeuanganPageGuide
        storageId="dashboard"
        intro="Hub ini menyatukan operasional kas harian dan akuntansi. Ikuti langkah sesuai peran Anda."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

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
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan/")({ component: KeuanganDashboard });
