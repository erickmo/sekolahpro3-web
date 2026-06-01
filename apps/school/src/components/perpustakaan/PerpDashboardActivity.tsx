/**
 * Perpustakaan dashboard — visualization block (presentational layer).
 *
 * Renders the four pure-data charts of the library Beranda: circulation status
 * (donut + legend), circulation health (progress ring), titles per category
 * (horizontal bars), and the 7-day loan trend (bars). Every series is computed
 * by the route via the unit-tested builders in `dashboardViz.ts` and passed in
 * — this component does no aggregation, no fetching, and no business logic.
 */
import {
  Badge,
  SectionCard,
} from "@sekolahpro/ui";
import {
  BarChart,
  DonutChart,
  HBarChart,
  ProgressRing,
  type ChartDatum,
  type DistributionSegment,
} from "../viz";
import type { KesehatanSirkulasi } from "./dashboardViz";

/** On-time circulation health thresholds (percent) for the ring tone. */
const HEALTH_GOOD_PCT = 80;
const HEALTH_WARN_PCT = 50;

/** id-ID thousands formatter shared by the bar charts. */
const formatId = (v: number) => v.toLocaleString("id-ID");

export interface PerpDashboardActivityProps {
  /** Loan status segments (donut + legend). */
  sirkulasiSegments: DistributionSegment[];
  /** Donut-shaped projection of {@link sirkulasiSegments}. */
  sirkulasiDonut: { label: string; value: number; tone: DistributionSegment["tone"] }[];
  /** Sum of all circulation segment values (donut center figure). */
  totalSirkulasi: number;
  /** Outstanding-loan health summary (ring). */
  kesehatan: KesehatanSirkulasi;
  /** Titles-per-category bars (top 8). */
  kategoriBars: ChartDatum[];
  /** 7-day loan-count series. */
  trenPeminjaman: ChartDatum[];
  /** Loading flags so each card shows its own placeholder. */
  loading: { buku: boolean; pinjam: boolean };
}

/** Pick the ring tone from the on-time percentage. */
function ringTone(percent: number): "emerald" | "amber" | "rose" {
  if (percent >= HEALTH_GOOD_PCT) return "emerald";
  if (percent >= HEALTH_WARN_PCT) return "amber";
  return "rose";
}

/** Status-sirkulasi donut with an inline legend listing every segment. */
function SirkulasiCard({
  loading,
  totalSirkulasi,
  sirkulasiDonut,
  sirkulasiSegments,
}: Pick<PerpDashboardActivityProps, "totalSirkulasi" | "sirkulasiDonut" | "sirkulasiSegments"> & {
  loading: boolean;
}) {
  return (
    <SectionCard
      title="Status Sirkulasi"
      description="Sebaran status seluruh transaksi peminjaman."
      className="lg:col-span-2"
    >
      {loading ? (
        <div className="text-sm text-muted-fg">Memuat...</div>
      ) : totalSirkulasi === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">
          Belum ada transaksi peminjaman.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <DonutChart
            data={sirkulasiDonut}
            centerTop={<span className="text-2xl font-semibold text-fg tabular-nums">{totalSirkulasi}</span>}
            centerBottom={<span className="text-xs text-muted-fg">transaksi</span>}
          />
          <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
            {sirkulasiSegments.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-muted-fg">
                  <Badge tone={s.label === "Terlambat" || s.label === "Hilang" ? "warning" : "neutral"} dot>
                    {s.label}
                  </Badge>
                </span>
                <span className="font-medium text-fg tabular-nums">{s.value.toLocaleString("id-ID")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

/** Outstanding-loan health ring (on-time vs overdue). */
function KesehatanCard({ loading, kesehatan }: { loading: boolean; kesehatan: KesehatanSirkulasi }) {
  return (
    <SectionCard
      title="Kesehatan Sirkulasi"
      description="Peminjaman aktif yang masih tepat waktu vs terlambat."
    >
      {loading ? (
        <div className="text-sm text-muted-fg">Memuat...</div>
      ) : kesehatan.total === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">
          Tidak ada peminjaman aktif.
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <ProgressRing
            value={kesehatan.percentTepatWaktu}
            tone={ringTone(kesehatan.percentTepatWaktu)}
            label={`${kesehatan.aktif.toLocaleString("id-ID")} tepat waktu · ${kesehatan.terlambat.toLocaleString("id-ID")} terlambat`}
          />
        </div>
      )}
    </SectionCard>
  );
}

/**
 * The full dashboard visualization block: circulation status & health on the
 * first row, then category distribution & loan trend on the second.
 */
export function PerpDashboardActivity({
  sirkulasiSegments,
  sirkulasiDonut,
  totalSirkulasi,
  kesehatan,
  kategoriBars,
  trenPeminjaman,
  loading,
}: PerpDashboardActivityProps) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <SirkulasiCard
          loading={loading.pinjam}
          totalSirkulasi={totalSirkulasi}
          sirkulasiDonut={sirkulasiDonut}
          sirkulasiSegments={sirkulasiSegments}
        />
        <KesehatanCard loading={loading.pinjam} kesehatan={kesehatan} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Koleksi per Kategori"
          description="Jumlah judul tiap kategori (8 terbanyak)."
        >
          {loading.buku ? (
            <div className="text-sm text-muted-fg">Memuat...</div>
          ) : (
            <HBarChart data={kategoriBars} valueFormatter={formatId} />
          )}
        </SectionCard>

        <SectionCard
          title="Tren Peminjaman 7 Hari"
          description="Jumlah transaksi pinjam per hari, hingga hari ini."
        >
          {loading.pinjam ? (
            <div className="text-sm text-muted-fg">Memuat...</div>
          ) : (
            <BarChart data={trenPeminjaman} valueFormatter={formatId} />
          )}
        </SectionCard>
      </div>
    </>
  );
}
