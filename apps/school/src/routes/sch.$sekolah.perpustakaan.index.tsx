import { useMemo, type ReactNode } from "react";
import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import {
  AttentionList,
  Badge,
  GettingStartedCard,
  PageHeader,
  SectionCard,
  StatCard,
  IconBook,
  IconWallet,
  IconAlert,
  IconCheck,
  IconUsers,
  IconChart,
  IconClock,
  IconArrowLeft,
  ModuleFlow,
} from "@sekolahpro/ui";
import type { AttentionItem, ModuleFlowStep } from "@sekolahpro/ui";

const PERPUS_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "kategori", label: "Kategori", hint: "Setup kategori koleksi", href: "/sch/$sekolah/perpustakaan/kategori" },
  { key: "pengadaan", label: "Pengadaan", hint: "Beli koleksi baru", href: "/sch/$sekolah/perpustakaan/pengadaan" },
  { key: "inventaris", label: "Inventaris", hint: "Catat & opname stok", href: "/sch/$sekolah/perpustakaan/inventaris" },
  { key: "anggota", label: "Anggota", hint: "Daftar peminjam", href: "/sch/$sekolah/perpustakaan/anggota" },
  { key: "peminjaman", label: "Peminjaman", hint: "Transaksi pinjam", href: "/sch/$sekolah/perpustakaan/peminjaman" },
  { key: "pengembalian", label: "Pengembalian", hint: "Terima kembali", href: "/sch/$sekolah/perpustakaan/pengembalian" },
  { key: "denda", label: "Denda", hint: "Tagih keterlambatan", href: "/sch/$sekolah/perpustakaan/denda" },
];
import { useResourceList } from "@sekolahpro/api-client";
import { BarChart, DonutChart, HBarChart, ProgressRing } from "../components/viz";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { ROLE_LABEL as PERPUS_ROLE_LABELS } from "../lib/perpustakaanRole";
import {
  buildKategoriBars,
  buildSirkulasiSegments,
  buildTrenPeminjaman,
  computeKesehatanSirkulasi,
} from "../components/perpustakaan/dashboardViz";
import { perpToday, perpMonthRange } from "../components/perpustakaan/perpFormatters";

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

const QUICK_ACTIONS: { to: string; label: string; description: string; icon: React.ReactNode }[] = [
  { to: "/sch/$sekolah/perpustakaan/terminal", label: "Terminal RFID", description: "Mode kios scan kartu + eksemplar.", icon: <IconBook /> },
  { to: "/sch/$sekolah/perpustakaan/peminjaman", label: "Peminjaman", description: "Catat peminjaman individu / kolektif.", icon: <IconCheck /> },
  { to: "/sch/$sekolah/perpustakaan/reservasi", label: "Reservasi", description: "Kelola antrian reservasi buku.", icon: <IconClock /> },
  { to: "/sch/$sekolah/perpustakaan/pengadaan", label: "Pengadaan", description: "Pembelian / hibah / sumbangan koleksi.", icon: <IconWallet /> },
  { to: "/sch/$sekolah/perpustakaan/inventaris/opname", label: "Stock Opname", description: "Audit inventaris via scan.", icon: <IconChart /> },
  { to: "/sch/$sekolah/perpustakaan/inventaris/berita-acara", label: "BA Kerusakan", description: "Insiden rusak / hilang per eksemplar.", icon: <IconAlert /> },
  { to: "/sch/$sekolah/perpustakaan/anggota", label: "Anggota", description: "Kelola data anggota perpustakaan.", icon: <IconUsers /> },
  { to: "/sch/$sekolah/perpustakaan/laporan", label: "Laporan", description: "Ringkasan sirkulasi & koleksi.", icon: <IconChart /> },
];

const PINJAM_TONE: Record<string, "brand" | "success" | "warning" | "danger" | "neutral"> = {
  Aktif: "brand",
  Selesai: "success",
  Terlambat: "warning",
  Hilang: "danger",
  Batal: "neutral",
};

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

  const stats = useMemo(() => {
    const totalJudul = buku.length;
    const aktif = pinjam.filter((p) => p.status === "Aktif").length;
    const terlambat = pinjam.filter((p) => p.status === "Terlambat").length;
    // Actionable: buku jatuh tempo hari ini (dueDate == today) — masih Aktif.
    const jatuhTempoHariIni = pinjam.filter(
      (p) => p.status === "Aktif" && p.tanggal_kembali_rencana === today,
    ).length;
    const dendaOutstanding = denda.reduce((s, d) => s + (d.nominal ?? 0), 0);
    const dendaCount = denda.length;
    const baPendingCount = baPending.length;
    const opnameDraftCount = opnameDrafts.length;
    const pengadaanEksBulanIni = pengadaanBulanIni.reduce((s, p) => s + (p.total_eksemplar ?? 0), 0);
    return {
      totalJudul, aktif, terlambat, jatuhTempoHariIni, dendaOutstanding, dendaCount,
      baPendingCount, opnameDraftCount, pengadaanEksBulanIni,
    };
  }, [buku, pinjam, denda, baPending, opnameDrafts, pengadaanBulanIni, today]);

  const perluPerhatianItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    for (const op of opnameDrafts) {
      items.push({
        id: `opname-${op.name}`,
        label: `Opname ${op.name}`,
        description: `Draft sesi ${op.tanggal ?? "—"} belum disubmit — lanjutkan scan`,
        tone: "neutral",
        badge: "Draft",
        actionLabel: "Resume",
        actionHref: `/sch/$sekolah/perpustakaan/inventaris/opname/${op.name}`,
      });
    }
    for (const ba of baPending) {
      items.push({
        id: `ba-${ba.name}`,
        label: `BA ${ba.name}`,
        description: `Insiden ${ba.tanggal_kejadian ?? "—"} menunggu approval Kepala Perpustakaan`,
        tone: "warning",
        badge: "Approval",
        actionLabel: "Review",
        actionHref: `/sch/$sekolah/perpustakaan/inventaris/berita-acara/${ba.name}`,
      });
    }
    for (const p of pinjam) {
      if (p.status === "Terlambat") {
        items.push({
          id: `terlambat-${p.name}`,
          label: p.name,
          description: `${p.anggota ?? "—"} · jatuh tempo ${p.tanggal_kembali_rencana ?? "—"}`,
          tone: "warning",
          badge: "Terlambat",
          actionLabel: "Kirim Pengingat",
          actionHref: "/sch/$sekolah/perpustakaan/peminjaman",
        });
      } else if (p.status === "Hilang") {
        items.push({
          id: `hilang-${p.name}`,
          label: p.name,
          description: `${p.anggota ?? "—"} · buku hilang — butuh penggantian`,
          tone: "danger",
          badge: "Hilang",
          actionLabel: "Buat Denda",
          actionHref: "/sch/$sekolah/perpustakaan/denda",
        });
      } else if (p.status === "Aktif" && p.tanggal_kembali_rencana === today) {
        items.push({
          id: `due-${p.name}`,
          label: p.name,
          description: `${p.anggota ?? "—"} · jatuh tempo hari ini`,
          tone: "neutral",
          actionLabel: "Cek Peminjaman",
          actionHref: "/sch/$sekolah/perpustakaan/peminjaman",
        });
      }
    }
    return items;
  }, [pinjam, baPending, opnameDrafts, today]);

  const aktivitasTerbaru = useMemo(() => pinjam.slice(0, 5), [pinjam]);

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Buku Jatuh Tempo Hari Ini"
          value={stats.jatuhTempoHariIni.toLocaleString("id-ID")}
          hint={pinjamQ.isLoading ? "memuat..." : "hubungi peminjam"}
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
          value={dendaQ.isLoading ? "…" : `Rp ${stats.dendaOutstanding.toLocaleString("id-ID")}`}
          hint={dendaQ.isLoading ? "memuat..." : `${stats.dendaCount.toLocaleString("id-ID")} tagihan terbuka`}
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
          value={baQ.isLoading ? "…" : stats.baPendingCount.toLocaleString("id-ID")}
          hint="Kepala Perpustakaan perlu review"
          icon={<IconAlert />}
          accent="rose"
          urgency={stats.baPendingCount > 0 ? "warn" : "normal"}
          actionHref="/sch/$sekolah/perpustakaan/inventaris/berita-acara"
          renderLink={renderLink}
        />
        <StatCard
          label="Opname Draft Tertinggal"
          value={opnameDraftQ.isLoading ? "…" : stats.opnameDraftCount.toLocaleString("id-ID")}
          hint="Sesi audit belum disubmit"
          icon={<IconChart />}
          accent="violet"
          urgency={stats.opnameDraftCount > 0 ? "warn" : "normal"}
          actionHref="/sch/$sekolah/perpustakaan/inventaris/opname"
          renderLink={renderLink}
        />
        <StatCard
          label="Eksemplar Baru Bulan Ini"
          value={pengadaanBulanIniQ.isLoading ? "…" : stats.pengadaanEksBulanIni.toLocaleString("id-ID")}
          hint={`${pengadaanBulanIni.length} pengadaan tercatat`}
          icon={<IconBook />}
          accent="emerald"
          urgency="normal"
          actionHref="/sch/$sekolah/perpustakaan/pengadaan"
          renderLink={renderLink}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Status Sirkulasi"
          description="Sebaran status seluruh transaksi peminjaman."
          className="lg:col-span-2"
        >
          {pinjamQ.isLoading ? (
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

        <SectionCard
          title="Kesehatan Sirkulasi"
          description="Peminjaman aktif yang masih tepat waktu vs terlambat."
        >
          {pinjamQ.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat...</div>
          ) : kesehatan.total === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">
              Tidak ada peminjaman aktif.
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ProgressRing
                value={kesehatan.percentTepatWaktu}
                tone={kesehatan.percentTepatWaktu >= 80 ? "emerald" : kesehatan.percentTepatWaktu >= 50 ? "amber" : "rose"}
                label={`${kesehatan.aktif.toLocaleString("id-ID")} tepat waktu · ${kesehatan.terlambat.toLocaleString("id-ID")} terlambat`}
              />
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Koleksi per Kategori"
          description="Jumlah judul tiap kategori (8 terbanyak)."
        >
          {bukuQ.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat...</div>
          ) : (
            <HBarChart data={kategoriBars} valueFormatter={(v) => v.toLocaleString("id-ID")} />
          )}
        </SectionCard>

        <SectionCard
          title="Tren Peminjaman 7 Hari"
          description="Jumlah transaksi pinjam per hari, hingga hari ini."
        >
          {pinjamQ.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat...</div>
          ) : (
            <BarChart data={trenPeminjaman} valueFormatter={(v) => v.toLocaleString("id-ID")} />
          )}
        </SectionCard>
      </div>

      <ModuleFlow
        title="Alur Operasi Perpustakaan"
        description="Langkah dari pengadaan koleksi sampai sirkulasi pinjam."
        steps={PERPUS_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/sch/$sekolah/perpustakaan/kategori"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

      <SectionCard title="Aksi Cepat" description="Lompat ke modul yang sering digunakan.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-brand hover:bg-muted/40"
            >
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-fg group-hover:text-brand">
                <span className="h-5 w-5">{a.icon}</span>
              </span>
              <div className="min-w-0">
                <div className="font-medium text-fg">{a.label}</div>
                <div className="text-xs text-muted-fg">{a.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Perlu Perhatian"
          description="Peminjaman terlambat, hilang, atau jatuh tempo hari ini."
          action={
            <Link to="/sch/$sekolah/perpustakaan/denda" params={{ sekolah }} className="text-xs text-brand hover:underline">
              Lihat semua
            </Link>
          }
        >
          {pinjamQ.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat...</div>
          ) : (
            <AttentionList
              items={perluPerhatianItems}
              maxItems={5}
              renderLink={renderLink}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Aktivitas Terbaru"
          description="5 peminjaman terakhir tercatat."
          action={
            <Link to="/sch/$sekolah/perpustakaan/peminjaman" params={{ sekolah }} className="text-xs text-brand hover:underline">
              Lihat semua
            </Link>
          }
        >
          {pinjamQ.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat...</div>
          ) : aktivitasTerbaru.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">
              Belum ada aktivitas peminjaman.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {aktivitasTerbaru.map((p) => (
                <li key={p.name} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="font-medium text-fg truncate">{p.name}</div>
                    <div className="text-xs text-muted-fg truncate">{p.anggota ?? "—"}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs tabular-nums text-muted-fg">{p.tanggal_pinjam ?? "—"}</span>
                    <Badge tone={PINJAM_TONE[p.status ?? ""] ?? "neutral"} dot>
                      {p.status ?? "—"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <p className="text-xs text-muted-fg">
        Tip: buka{" "}
        <Link to="/sch/$sekolah/perpustakaan/daftar" params={{ sekolah }} className="text-brand hover:underline inline-flex items-center gap-1">
          <span className="h-3 w-3"><IconArrowLeft /></span>
          katalog buku lengkap
        </Link>
        {" "}untuk mencari atau menambahkan koleksi baru.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/")({ component: PerpustakaanDashboardPage });
