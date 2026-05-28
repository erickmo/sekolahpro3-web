import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import { GedungFormModal } from "../components/infrastruktur/GedungFormModal";
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
  ModuleFlow,
  type ModuleFlowStep,
} from "@sekolahpro/ui";

const INFRA_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "daftar", label: "Daftar Gedung", hint: "Registrasi gedung", href: "/$sekolah/infrastruktur/daftar" },
  { key: "lantai", label: "Lantai", hint: "Definisi per lantai", href: "/$sekolah/infrastruktur/lantai" },
  { key: "ruangan", label: "Ruangan", hint: "Setup ruang & kapasitas", href: "/$sekolah/infrastruktur/ruangan" },
  { key: "fasilitas", label: "Fasilitas", hint: "Daftar fasilitas", href: "/$sekolah/infrastruktur/fasilitas" },
  { key: "utilitas", label: "Utilitas", hint: "Listrik, air, dll", href: "/$sekolah/infrastruktur/utilitas" },
];
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
  { to: "/$sekolah/infrastruktur/ruangan", label: "Ruangan", desc: "Kelola ruangan & kapasitas", icon: <IconHome /> },
  { to: "/$sekolah/infrastruktur/lantai", label: "Lantai", desc: "Struktur lantai per gedung", icon: <IconGrad /> },
  { to: "/$sekolah/infrastruktur/fasilitas", label: "Fasilitas", desc: "Inventaris fasilitas ruangan", icon: <IconSettings /> },
  { to: "/$sekolah/infrastruktur/utilitas", label: "Utilitas", desc: "PLN, PDAM, internet, gas", icon: <IconBell /> },
];

function InfraDashboardPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const [showCreate, setShowCreate] = useState(false);
  const ruanganQ = useResourceList<Ruangan>("Ruangan", {
    fields: RUANGAN_FIELDS,
    limit_page_length: PAGE_LIMIT,
  });

  const fasilitasRusakQ = useResourceList<{ name: string }>("Fasilitas Ruangan", {
    fields: ["name"],
    filters: [
      ["parenttype", "=", "Ruangan"],
      ["kondisi", "=", "Rusak"],
    ],
    limit_page_length: 0,
  });

  const utilitasAnomaliQ = useResourceList<{ name: string }>("Utilitas Gedung", {
    fields: ["name"],
    filters: [["status", "=", "Nonaktif"]],
    limit_page_length: 0,
  });

  const ruangan = ruanganQ.data ?? [];
  const fasilitasRusakCount = fasilitasRusakQ.data?.length ?? 0;
  const utilitasAnomaliCount = utilitasAnomaliQ.data?.length ?? 0;

  const stats = useMemo(() => {
    const totalRuangan = ruangan.length;
    // Ruangan.status: Tersedia / Dipakai / Maintenance.
    const ruanganAktif = ruangan.filter((r) => r.status === "Tersedia" || r.status === "Dipakai").length;
    const ruanganDipakai = ruangan.filter((r) => r.status === "Dipakai").length;
    const ruanganPerbaikan = ruangan.filter((r) => r.status === "Maintenance").length;
    const totalKapasitas = ruangan.reduce((s, r) => s + (r.kapasitas ?? 0), 0);
    const bookedHariIni = ruanganDipakai;
    const utilisasiPct = ruanganAktif > 0 ? Math.round((bookedHariIni / ruanganAktif) * 100) : 0;
    return {
      totalRuangan,
      ruanganAktif,
      ruanganPerbaikan,
      totalKapasitas,
      bookedHariIni,
      utilisasiPct,
      fasilitasRusak: fasilitasRusakCount,
      utilitasAnomali: utilitasAnomaliCount,
    };
  }, [ruangan, fasilitasRusakCount, utilitasAnomaliCount]);

  const FASILITAS_CRITICAL_THRESHOLD = 5;

  const ruanganTerbaru = useMemo(() => ruangan.slice(0, RECENT_LIMIT), [ruangan]);

  const perluPerhatian = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (stats.fasilitasRusak > 0) {
      items.push({
        id: "fasilitas-rusak",
        label: `${stats.fasilitasRusak} fasilitas rusak`,
        description: "Fasilitas Ruangan berstatus Rusak",
        tone: stats.fasilitasRusak > FASILITAS_CRITICAL_THRESHOLD ? "danger" : "warning",
        badge: "Fasilitas",
        actionLabel: "Buat Perbaikan",
        actionHref: "/$sekolah/infrastruktur/fasilitas",
      });
    }
    if (stats.utilitasAnomali > 0) {
      items.push({
        id: "utilitas-anomali",
        label: `${stats.utilitasAnomali} utilitas nonaktif`,
        description: "Utilitas Gedung berstatus Nonaktif",
        tone: "danger",
        badge: "Utilitas",
        actionLabel: "Investigasi",
        actionHref: "/$sekolah/infrastruktur/utilitas",
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
              to="/$sekolah/infrastruktur/daftar" params={{ sekolah }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 border border-border bg-transparent hover:bg-muted"
            >
              <span className="h-4 w-4 mr-1.5"><IconHome /></span>
              Lihat Daftar Gedung
            </Link>
            <Button onClick={() => setShowCreate(true)}>
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
          actionHref="/$sekolah/infrastruktur/ruangan"
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
          actionHref="/$sekolah/infrastruktur/fasilitas"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Utilitas Anomali"
          value={stats.utilitasAnomali}
          hint="PLN/PDAM/internet"
          icon={<IconBell />}
          accent="rose"
          urgency="critical"
          actionHref="/$sekolah/infrastruktur/utilitas"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <ModuleFlow
        title="Alur Setup Infrastruktur"
        description="Bangun struktur fisik sekolah dari gedung sampai fasilitas."
        steps={INFRA_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/$sekolah/infrastruktur/daftar"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

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
            <Link to={href as "/$sekolah/infrastruktur/fasilitas"} params={{ sekolah }}>{children}</Link>
          )}
        />
      </SectionCard>

      <SectionCard
        title="Ruangan Terbaru"
        description="Ruangan yang baru-baru ini tercatat."
        action={
          <Link to="/$sekolah/infrastruktur/ruangan" params={{ sekolah }} className="text-xs text-brand hover:underline">
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
                    to="/$sekolah/infrastruktur/ruangan" params={{ sekolah }}
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

      <GedungFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/infrastruktur/")({ component: InfraDashboardPage });
