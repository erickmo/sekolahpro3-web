/**
 * Perpustakaan dashboard (Beranda): role-framed overview for the circulation desk.
 * Surfaces urgent counts (due today, overdue, denda) and pure-data visualizations
 * (sirkulasi status, on-time health, kategori, 7-day trend) plus a needs-attention
 * queue. All metrics derive from already-fetched lists — no extra backend calls.
 *
 * Route layer: owns data fetching + derivation, then composes the presentational
 * dashboard sub-components (Stats / Activity / Attention / Health). Role framing
 * lives in the Perpustakaan layout ContextBar — not here.
 */
import { useMemo, type ReactNode } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  GettingStartedCard,
  PageHeader,
  IconBook,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { ROLE_LABEL as PERPUS_ROLE_LABELS } from "../lib/perpustakaanRole";
import {
  buildKategoriBars,
  buildSirkulasiSegments,
  buildTrenPeminjaman,
  computeKesehatanSirkulasi,
} from "../components/perpustakaan/dashboardViz";
import {
  buildDashboardStats,
  buildPerluPerhatianItems,
} from "../components/perpustakaan/perpDashboardData";
import { perpToday, perpMonthRange } from "../components/perpustakaan/perpFormatters";
import { PerpDashboardStats } from "../components/perpustakaan/PerpDashboardStats";
import { PerpDashboardActivity } from "../components/perpustakaan/PerpDashboardActivity";
import { PerpDashboardAttention } from "../components/perpustakaan/PerpDashboardAttention";
import { PerpDashboardHealth } from "../components/perpustakaan/PerpDashboardHealth";

// Onboarding guide for the dashboard, role-tagged so a new petugas, a pustakawan
// reviewing, and an admin all see which steps speak to them — without hiding any.
const DASHBOARD_GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Mulai dari yang mendesak",
    detail: "Kartu di atas menyoroti jatuh tempo hari ini, keterlambatan, dan denda. Tangani itu lebih dulu.",
    roles: ["petugas"],
  },
  {
    title: "Buka Terminal untuk sirkulasi cepat",
    detail: "Tombol 'Buka Terminal Sirkulasi' di bar atas membuka mode scan kartu + eksemplar.",
    roles: ["petugas"],
  },
  {
    title: "Pantau sebaran lewat grafik",
    detail: "Status sirkulasi, kesehatan pinjaman, koleksi per kategori, dan tren 7 hari ada di bagian visualisasi.",
    roles: ["pustakawan", "petugas"],
  },
  {
    title: "Tindak lanjuti approval & opname",
    detail: "BA kerusakan menunggu approval dan draft opname yang tertinggal muncul di 'Perlu Perhatian'.",
    roles: ["pustakawan", "admin"],
  },
];

const DASHBOARD_GUIDE_TIPS = [
  "Setiap kartu & item bisa diklik untuk langsung ke halaman tindak lanjutnya.",
  "Grafik dihitung dari data yang sudah dimuat — tanpa beban query tambahan.",
];

// Window length (days) for the loan-trend bar chart on the dashboard.
const TREN_HARI = 7;
/** Rows shown in the "recent activity" list. */
const RECENT_LIMIT = 5;

type BukuRow = {
  name: string;
  judul?: string;
  pengarang?: string;
  kategori?: string;
  tahun_terbit?: number;
};

type PeminjamanRow = {
  name: string;
  anggota?: string;
  tanggal_pinjam?: string;
  tanggal_kembali_rencana?: string;
  status?: string;
};

type DendaRow = {
  name: string;
  nominal?: number;
  status?: string;
};

type BARow = { name: string; docstatus?: number; tanggal_kejadian?: string };
type OpnameRow = { name: string; docstatus?: number; tanggal?: string };
type PengadaanRow = { name: string; tanggal_pengadaan?: string; total_eksemplar?: number };

function PerpustakaanDashboardPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  // Resolve the `$sekolah` segment and feed TanStack params so every dashboard
  // action href (StatCard / AttentionList / GettingStarted) navigates to a real
  // scoped path instead of the raw template, which 404s. PERP-GAP-04
  const renderLink = (href: string, children: ReactNode, className?: string) => (
    <Link to={href.replace("$sekolah", sekolah)} params={{ sekolah }} className={className}>
      {children}
    </Link>
  );

  // Live reference date; the dashboard's "hari ini", due-today, and rolling
  // trend window all derive from it instead of a frozen literal. PERP-GAP-08
  const today = perpToday();
  const { start: monthStart, nextStart: monthNextStart } = perpMonthRange(today);

  const bukuQ = useResourceList<BukuRow>("Buku", {
    fields: ["name", "judul", "pengarang", "kategori", "tahun_terbit"],
    limit_page_length: 0,
  });

  const pinjamQ = useResourceList<PeminjamanRow>("Peminjaman Buku", {
    fields: ["name", "anggota", "tanggal_pinjam", "tanggal_kembali_rencana", "status"],
    order_by: "`tanggal_pinjam` desc",
    limit_page_length: 200,
  });

  const dendaQ = useResourceList<DendaRow>("Denda Perpustakaan", {
    fields: ["name", "nominal", "status"],
    filters: { status: "Belum Lunas" },
    limit_page_length: 0,
  });

  const baQ = useResourceList<BARow>("Berita Acara Kerusakan Buku", {
    fields: ["name", "docstatus", "tanggal_kejadian"],
    filters: { docstatus: 0 },
    order_by: "tanggal_kejadian desc",
    limit_page_length: 0,
  });

  const opnameDraftQ = useResourceList<OpnameRow>("Stock Opname Perpustakaan", {
    fields: ["name", "docstatus", "tanggal"],
    filters: { docstatus: 0 },
    order_by: "tanggal desc",
    limit_page_length: 0,
  });

  const pengadaanBulanIniQ = useResourceList<PengadaanRow>("Pengadaan Buku", {
    fields: ["name", "tanggal_pengadaan", "total_eksemplar"],
    filters: [
      ["tanggal_pengadaan", ">=", monthStart],
      ["tanggal_pengadaan", "<", monthNextStart],
    ],
    limit_page_length: 0,
  });

  // Stabilize derived arrays so dependent useMemo hooks don't recompute every
  // render when a query's data is still undefined (`?? []` would be a new ref).
  const buku = useMemo(() => bukuQ.data ?? [], [bukuQ.data]);
  const pinjam = useMemo(() => pinjamQ.data ?? [], [pinjamQ.data]);
  const denda = useMemo(() => dendaQ.data ?? [], [dendaQ.data]);
  const baPending = useMemo(() => baQ.data ?? [], [baQ.data]);
  const opnameDrafts = useMemo(() => opnameDraftQ.data ?? [], [opnameDraftQ.data]);
  const pengadaanBulanIni = useMemo(() => pengadaanBulanIniQ.data ?? [], [pengadaanBulanIniQ.data]);

  // Counters & attention queue are pure derivations of the fetched lists; the
  // logic lives in dashboardViz.ts (unit-tested) so the route stays thin.
  const stats = useMemo(
    () => buildDashboardStats({ buku, pinjam, denda, baPending, opnameDrafts, pengadaanBulanIni, today }),
    [buku, pinjam, denda, baPending, opnameDrafts, pengadaanBulanIni, today],
  );

  const perluPerhatianItems = useMemo(
    () => buildPerluPerhatianItems({ pinjam, baPending, opnameDrafts, today }),
    [pinjam, baPending, opnameDrafts, today],
  );

  const aktivitasTerbaru = useMemo(() => pinjam.slice(0, RECENT_LIMIT), [pinjam]);

  // Visualizations derived purely from data already fetched above (no extra
  // backend calls). Logic lives in dashboardViz.ts and is unit-tested there.
  const kategoriBars = useMemo(() => buildKategoriBars(buku), [buku]);
  const sirkulasiSegments = useMemo(() => buildSirkulasiSegments(pinjam), [pinjam]);
  const trenPeminjaman = useMemo(() => buildTrenPeminjaman(pinjam, today, TREN_HARI), [pinjam, today]);
  const kesehatan = useMemo(() => computeKesehatanSirkulasi(pinjam), [pinjam]);
  const sirkulasiDonut = useMemo(
    () => sirkulasiSegments.map((s) => ({ label: s.label, value: s.value, tone: s.tone })),
    [sirkulasiSegments],
  );
  const totalSirkulasi = useMemo(
    () => sirkulasiSegments.reduce((sum, s) => sum + s.value, 0),
    [sirkulasiSegments],
  );

  const isZeroState = !bukuQ.isLoading && !bukuQ.isError && buku.length === 0;

  // The dashboard always renders. When the collection is empty we surface an
  // inline banner inviting staff to add the first books instead of replacing
  // the whole page with a single caption.
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Layanan"
        title="Dashboard Perpustakaan"
        description="Ringkasan koleksi, sirkulasi, dan tindakan cepat untuk operasional harian."
      />

      <PageGuide
        storageId="perpus-dashboard"
        title="Cara pakai Dashboard Perpustakaan"
        intro="Dirancang untuk petugas sirkulasi: lihat yang mendesak lebih dulu, lalu bertindak langsung dari kartu & grafik di bawah."
        steps={DASHBOARD_GUIDE_STEPS}
        tips={DASHBOARD_GUIDE_TIPS}
        roleLabels={PERPUS_ROLE_LABELS}
      />

      {isZeroState && (
        <GettingStartedCard
          icon={<IconBook />}
          title="Perpustakaan belum punya koleksi"
          description="Input buku pertama atau import katalog untuk mulai layanan peminjaman."
          primaryAction={{ label: "Tambah Buku", href: "/sch/$sekolah/perpustakaan/daftar" }}
          renderLink={renderLink}
        />
      )}

      <PerpDashboardStats
        stats={stats}
        loading={{
          pinjam: pinjamQ.isLoading,
          denda: dendaQ.isLoading,
          ba: baQ.isLoading,
          opname: opnameDraftQ.isLoading,
          pengadaan: pengadaanBulanIniQ.isLoading,
        }}
        pengadaanCount={pengadaanBulanIni.length}
        renderLink={renderLink}
      />

      <PerpDashboardActivity
        sirkulasiSegments={sirkulasiSegments}
        sirkulasiDonut={sirkulasiDonut}
        totalSirkulasi={totalSirkulasi}
        kesehatan={kesehatan}
        kategoriBars={kategoriBars}
        trenPeminjaman={trenPeminjaman}
        loading={{ buku: bukuQ.isLoading, pinjam: pinjamQ.isLoading }}
      />

      <PerpDashboardHealth sekolah={sekolah} />

      <PerpDashboardAttention
        sekolah={sekolah}
        perluPerhatianItems={perluPerhatianItems}
        aktivitasTerbaru={aktivitasTerbaru}
        loading={pinjamQ.isLoading}
        renderLink={renderLink}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/")({ component: PerpustakaanDashboardPage });
