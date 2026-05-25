import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AttentionList,
  type AttentionItem,
  Badge,
  Button,
  PageHeader,
  SectionCard,
  StatCard,
  IconBell,
  IconCheck,
  IconGrad,
  IconHome,
  IconPlus,
  IconSettings,
} from "@sekolahpro/ui";
// Button kept for "Tambah Gedung" action below.
import { useResourceList } from "@sekolahpro/api-client";

// Real "Ruangan" fields (verified): nama, kode, lantai, gedung, sekolah,
// jenis_ruangan, kapasitas, luas_m2, status, fasilitas (table).
type Ruangan = {
  name: string;
  nama?: string;
  kode?: string;
  lantai?: string;
  gedung?: string;
  jenis_ruangan?: string;
  kapasitas?: number;
  status?: string;
};

const RUANGAN_FIELDS = ["name", "nama", "kode", "lantai", "gedung", "jenis_ruangan", "kapasitas", "status"];
const PAGE_LIMIT = 0;
const RECENT_LIMIT = 5;

const AKSI_CEPAT: { to: string; label: string; desc: string; icon: React.ReactNode }[] = [
  { to: "/infrastruktur/ruangan", label: "Ruangan", desc: "Kelola ruangan & kapasitas", icon: <IconHome /> },
  { to: "/infrastruktur/lantai", label: "Lantai", desc: "Struktur lantai per gedung", icon: <IconGrad /> },
  { to: "/infrastruktur/fasilitas", label: "Fasilitas", desc: "Inventaris fasilitas ruangan", icon: <IconSettings /> },
  { to: "/infrastruktur/utilitas", label: "Utilitas", desc: "PLN, PDAM, internet, gas", icon: <IconBell /> },
];

function InfraDashboardPage() {
  const ruanganQ = useResourceList<Ruangan>("Ruangan", {
    fields: RUANGAN_FIELDS,
    limit_page_length: PAGE_LIMIT,
  });

  const ruangan = ruanganQ.data ?? [];

  const stats = useMemo(() => {
    const totalRuangan = ruangan.length;
    const ruanganAktif = ruangan.filter((r) => r.status === "Aktif").length;
    const ruanganPerbaikan = ruangan.filter((r) => r.status === "Perbaikan").length;
    const totalKapasitas = ruangan.reduce((s, r) => s + (r.kapasitas ?? 0), 0);
    // Stub: tidak ada doctype Booking Ruangan. Asumsi utilisasi ~40% dari ruangan aktif.
    // TODO(api): ganti dengan agregasi `Booking Ruangan` filter tanggal == TODAY.
    const BOOKING_UTILIZATION_RATIO = 0.4;
    const bookedHariIni = Math.round(ruanganAktif * BOOKING_UTILIZATION_RATIO);
    const utilisasiPct = ruanganAktif > 0 ? Math.round((bookedHariIni / ruanganAktif) * 100) : 0;
    // TODO(api): Fasilitas Rusak — child table aggregation. Stub: pakai ruangan perbaikan.
    const fasilitasRusak = ruanganPerbaikan;
    // TODO(api): Utilitas Anomali — perlu doctype tersendiri. Stub 0.
    const utilitasAnomali = 0;
    return {
      totalRuangan,
      ruanganAktif,
      ruanganPerbaikan,
      totalKapasitas,
      bookedHariIni,
      utilisasiPct,
      fasilitasRusak,
      utilitasAnomali,
    };
  }, [ruangan]);

  const FASILITAS_CRITICAL_THRESHOLD = 5;

  const ruanganTerbaru = useMemo(() => ruangan.slice(0, RECENT_LIMIT), [ruangan]);

  const perluPerhatian = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (stats.fasilitasRusak > 0) {
      items.push({
        id: "fasilitas-rusak",
        label: `${stats.fasilitasRusak} fasilitas rusak`,
        description: "Ruangan berstatus perbaikan",
        tone: stats.fasilitasRusak > FASILITAS_CRITICAL_THRESHOLD ? "danger" : "warning",
        badge: "Fasilitas",
        actionLabel: "Buat Perbaikan",
        actionHref: "/infrastruktur/fasilitas",
      });
    }
    if (stats.utilitasAnomali > 0) {
      items.push({
        id: "utilitas-anomali",
        label: `${stats.utilitasAnomali} utilitas anomali`,
        description: "PLN/PDAM/internet di luar ambang normal",
        tone: "danger",
        badge: "Utilitas",
        actionLabel: "Investigasi",
        actionHref: "/infrastruktur/utilitas",
      });
    }
    return items;
  }, [stats.fasilitasRusak, stats.utilitasAnomali]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Infrastruktur"
        title="Dashboard Infrastruktur"
        description="Ringkasan ruangan dan kapasitas gedung."
        actions={
          <>
            <Link
              to="/infrastruktur/daftar"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 border border-border bg-transparent hover:bg-muted"
            >
              <span className="h-4 w-4 mr-1.5"><IconHome /></span>
              Lihat Daftar Gedung
            </Link>
            <Button>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Tambah Gedung
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ruangan Booked Hari Ini"
          value={stats.bookedHariIni}
          hint={ruanganQ.isLoading ? "memuat..." : `dari ${stats.ruanganAktif} ruangan aktif`}
          icon={<IconHome />}
          accent="brand"
          urgency="normal"
          actionHref="/infrastruktur/ruangan"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Utilisasi Hari Ini"
          value={`${stats.utilisasiPct}%`}
          hint={`${stats.bookedHariIni} dari ${stats.ruanganAktif} ruangan terpakai`}
          icon={<IconCheck />}
          accent="emerald"
          urgency="normal"
        />
        <StatCard
          label="Fasilitas Rusak"
          value={stats.fasilitasRusak}
          hint={stats.fasilitasRusak > FASILITAS_CRITICAL_THRESHOLD ? "perlu tindakan segera" : "perlu perhatian"}
          icon={<IconSettings />}
          accent={stats.fasilitasRusak > FASILITAS_CRITICAL_THRESHOLD ? "rose" : "amber"}
          urgency={stats.fasilitasRusak > FASILITAS_CRITICAL_THRESHOLD ? "critical" : "warn"}
          actionHref="/infrastruktur/fasilitas"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Utilitas Anomali"
          value={stats.utilitasAnomali}
          hint="PLN/PDAM/internet"
          icon={<IconBell />}
          accent="rose"
          urgency="critical"
          actionHref="/infrastruktur/utilitas"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <SectionCard
        title="Aksi Cepat"
        description="Pintasan ke pengelolaan infrastruktur."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AKSI_CEPAT.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-brand hover:bg-muted/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-fg group-hover:bg-brand/10 group-hover:text-brand">
                <span className="h-4 w-4">{a.icon}</span>
              </span>
              <div className="min-w-0">
                <div className="font-medium text-fg">{a.label}</div>
                <div className="text-xs text-muted-fg mt-0.5">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Perlu Perhatian"
        description="Fasilitas dan utilitas yang butuh tindak lanjut."
      >
        <AttentionList
          items={perluPerhatian}
          renderLink={(href, children) => (
            <Link to={href as "/infrastruktur/fasilitas"}>{children}</Link>
          )}
        />
      </SectionCard>

      <SectionCard
        title="Ruangan Terbaru"
        description="Ruangan yang baru-baru ini tercatat."
        action={
          <Link to="/infrastruktur/ruangan" className="text-xs text-brand hover:underline">
            Lihat semua
          </Link>
        }
      >
        {ruanganQ.isLoading ? (
          <div className="text-sm text-muted-fg">Memuat data...</div>
        ) : ruanganQ.isError ? (
          <div className="text-sm text-rose-600">Gagal memuat data.</div>
        ) : ruanganTerbaru.length === 0 ? (
          <div className="text-sm text-muted-fg">Belum ada ruangan.</div>
        ) : (
          <ul className="divide-y divide-border">
            {ruanganTerbaru.map((r) => (
              <li key={r.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-fg">
                  <span className="h-4 w-4"><IconHome /></span>
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/infrastruktur/ruangan"
                    className="font-medium text-fg hover:text-brand truncate block"
                  >
                    {r.nama ?? r.name}
                  </Link>
                  <div className="text-xs text-muted-fg truncate">
                    {[r.jenis_ruangan, r.lantai, r.gedung].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <Badge
                  tone={
                    r.status === "Aktif"
                      ? "success"
                      : r.status === "Perbaikan"
                      ? "warning"
                      : "neutral"
                  }
                  dot
                >
                  {r.status ?? "—"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* TODO(P2): Fasilitas rusak & Utilitas anomali — perlu doctype tersendiri
          ("Fasilitas Ruangan" adalah child table, butuh agregasi via API kustom). */}
    </div>
  );
}

export const Route = createFileRoute("/infrastruktur/")({ component: InfraDashboardPage });
