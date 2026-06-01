/**
 * Perpustakaan dashboard — stat-card rows (presentational layer).
 *
 * Renders the two StatCard grids (urgent circulation metrics + collection /
 * approval metrics) for the library Beranda. All numbers and loading flags are
 * computed by the route and passed in as props; this component owns no data
 * fetching and no business logic — it only arranges cards and wires action
 * links back through the route's `renderLink`.
 */
import type { ReactNode } from "react";
import {
  StatCard,
  IconBook,
  IconWallet,
  IconAlert,
  IconCheck,
  IconChart,
} from "@sekolahpro/ui";
import { perpFormatRupiah } from "./perpFormatters";

/**
 * Scoped link renderer the route supplies so every card action resolves the
 * `$sekolah` segment to a real path. Matches the UI components' optional
 * `className` third argument.
 */
export type PerpRenderLink = (href: string, children: ReactNode, className?: string) => ReactNode;

/** Aggregated dashboard counters, computed once in the route. */
export interface PerpDashboardStatsValues {
  jatuhTempoHariIni: number;
  aktif: number;
  terlambat: number;
  dendaOutstanding: number;
  dendaCount: number;
  baPendingCount: number;
  opnameDraftCount: number;
  pengadaanEksBulanIni: number;
}

/** Per-query loading flags so each card can show its own placeholder. */
export interface PerpDashboardStatsLoading {
  pinjam: boolean;
  denda: boolean;
  ba: boolean;
  opname: boolean;
  pengadaan: boolean;
}

export interface PerpDashboardStatsProps {
  stats: PerpDashboardStatsValues;
  loading: PerpDashboardStatsLoading;
  /** Count of pengadaan docs this month — used in the hint copy. */
  pengadaanCount: number;
  renderLink: PerpRenderLink;
}

/** Placeholder glyph shown while a metric query is still loading. */
const LOADING_GLYPH = "…";

/**
 * Two responsive StatCard grids: the first four cards surface the most urgent
 * circulation signals, the next three cover collection health & approvals.
 */
export function PerpDashboardStats({
  stats,
  loading,
  pengadaanCount,
  renderLink,
}: PerpDashboardStatsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Buku Jatuh Tempo Hari Ini"
          value={stats.jatuhTempoHariIni.toLocaleString("id-ID")}
          hint={loading.pinjam ? "memuat..." : "hubungi peminjam"}
          icon={<IconBook />}
          accent="amber"
          urgency="warn"
          actionHref="/sch/$sekolah/perpustakaan/peminjaman"
          renderLink={renderLink}
        />
        <StatCard
          label="Peminjaman Aktif"
          value={stats.aktif.toLocaleString("id-ID")}
          hint="sedang berjalan"
          icon={<IconWallet />}
          accent="violet"
          urgency="normal"
        />
        <StatCard
          label="Terlambat"
          value={stats.terlambat.toLocaleString("id-ID")}
          hint="perlu tindak lanjut"
          icon={<IconAlert />}
          accent="rose"
          urgency="critical"
          actionHref="/sch/$sekolah/perpustakaan/peminjaman"
          renderLink={renderLink}
        />
        <StatCard
          label="Denda Belum Dibayar"
          value={loading.denda ? LOADING_GLYPH : perpFormatRupiah(stats.dendaOutstanding)}
          hint={loading.denda ? "memuat..." : `${stats.dendaCount.toLocaleString("id-ID")} tagihan terbuka`}
          icon={<IconCheck />}
          accent="amber"
          urgency={stats.dendaOutstanding > 0 ? "warn" : "normal"}
          actionHref="/sch/$sekolah/perpustakaan/peminjaman"
          renderLink={renderLink}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="BA Kerusakan Menunggu Approval"
          value={loading.ba ? LOADING_GLYPH : stats.baPendingCount.toLocaleString("id-ID")}
          hint="Kepala Perpustakaan perlu review"
          icon={<IconAlert />}
          accent="rose"
          urgency={stats.baPendingCount > 0 ? "warn" : "normal"}
          actionHref="/sch/$sekolah/perpustakaan/inventaris/berita-acara"
          renderLink={renderLink}
        />
        <StatCard
          label="Opname Draft Tertinggal"
          value={loading.opname ? LOADING_GLYPH : stats.opnameDraftCount.toLocaleString("id-ID")}
          hint="Sesi audit belum disubmit"
          icon={<IconChart />}
          accent="violet"
          urgency={stats.opnameDraftCount > 0 ? "warn" : "normal"}
          actionHref="/sch/$sekolah/perpustakaan/inventaris/opname"
          renderLink={renderLink}
        />
        <StatCard
          label="Eksemplar Baru Bulan Ini"
          value={loading.pengadaan ? LOADING_GLYPH : stats.pengadaanEksBulanIni.toLocaleString("id-ID")}
          hint={`${pengadaanCount} pengadaan tercatat`}
          icon={<IconBook />}
          accent="emerald"
          urgency="normal"
          actionHref="/sch/$sekolah/perpustakaan/pengadaan"
          renderLink={renderLink}
        />
      </div>
    </>
  );
}
