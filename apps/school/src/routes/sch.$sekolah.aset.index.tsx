import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  AttentionList,
  type AttentionItem,
  Badge,
  Button,
  PageHeader,
  SectionCard,
  StatCard,
  IconLayers,
  IconCheck,
  IconClock,
  IconSettings,
  IconPlus,
  ModuleFlow,
  type ModuleFlowStep,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide";
import { ASET_PAGE_GUIDES } from "../components/aset/pageGuides";
import { AsetFormModal } from "../components/aset/AsetFormModal";
import { ROLE_LABEL, useAsetRole } from "../lib/aset/role";
import {
  computeAsetStats,
  overduePeminjaman,
  type AsetRow,
  type PeminjamanRow,
} from "../lib/aset/stats";
import { asetStatusTone } from "../lib/aset/badges";

const ASET_FIELDS = ["name", "nama", "kategori", "lokasi", "jumlah_total", "jumlah_tersedia", "kondisi", "status"];
const PEMINJAMAN_FIELDS = ["name", "status", "tanggal_kembali_rencana"];
const MAINTENANCE_FIELDS = ["name", "status"];
const RECENT_LIMIT = 5;

const FLOW_STEPS: ModuleFlowStep[] = [
  { key: "kategori", label: "Kategori & Lokasi", hint: "Siapkan master", href: "/sch/$sekolah/aset/kategori" },
  { key: "daftar", label: "Daftar Aset", hint: "Registrasi inventaris", href: "/sch/$sekolah/aset/daftar" },
  { key: "pinjam", label: "Peminjaman", hint: "Pinjam & kembali", href: "/sch/$sekolah/aset/peminjaman" },
  { key: "maintenance", label: "Maintenance", hint: "Perbaikan & servis", href: "/sch/$sekolah/aset/maintenance" },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

function AsetDashboardPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const role = useAsetRole();
  const [showCreate, setShowCreate] = useState(false);

  const asetQ = useResourceList<AsetRow>("Aset", { fields: ASET_FIELDS, limit_page_length: 0 });
  const pinjamQ = useResourceList<PeminjamanRow>("Permintaan Peminjaman Aset", {
    fields: PEMINJAMAN_FIELDS,
    limit_page_length: 0,
  });
  const maintenanceQ = useResourceList<{ name: string; status?: string }>("Permintaan Maintenance Aset", {
    fields: MAINTENANCE_FIELDS,
    limit_page_length: 0,
  });

  const asets = useMemo(() => asetQ.data ?? [], [asetQ.data]);
  const peminjaman = useMemo(() => pinjamQ.data ?? [], [pinjamQ.data]);
  const maintenance = useMemo(() => maintenanceQ.data ?? [], [maintenanceQ.data]);

  const stats = useMemo(() => computeAsetStats(asets), [asets]);
  const diajukan = useMemo(() => peminjaman.filter((p) => p.status === "Diajukan").length, [peminjaman]);
  const terlambat = useMemo(() => overduePeminjaman(peminjaman, todayIso()).length, [peminjaman]);
  const maintenanceTerbuka = useMemo(
    () => maintenance.filter((m) => ["Dilaporkan", "Dijadwalkan", "Dikerjakan"].includes(m.status ?? "")).length,
    [maintenance],
  );
  const recent = useMemo(() => asets.slice(0, RECENT_LIMIT), [asets]);

  const perluPerhatian = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (terlambat > 0) {
      items.push({
        id: "terlambat",
        label: `${terlambat} peminjaman terlambat`,
        description: "Lewat tanggal kembali rencana",
        tone: "danger",
        badge: "Peminjaman",
        actionLabel: "Lihat",
        actionHref: "/sch/$sekolah/aset/peminjaman",
      });
    }
    if (diajukan > 0) {
      items.push({
        id: "diajukan",
        label: `${diajukan} permintaan menunggu persetujuan`,
        description: "Permintaan berstatus Diajukan",
        tone: "warning",
        badge: "Approval",
        actionLabel: "Tinjau",
        actionHref: "/sch/$sekolah/aset/peminjaman",
      });
    }
    if (stats.asetRusak > 0) {
      items.push({
        id: "rusak",
        label: `${stats.asetRusak} aset rusak`,
        description: "Kondisi Rusak Ringan / Berat",
        tone: stats.asetRusak > 5 ? "danger" : "warning",
        badge: "Kondisi",
      });
    }
    return items;
  }, [terlambat, diajukan, stats.asetRusak]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manajemen Aset"
        title="Dashboard Aset"
        description={`Ringkasan inventaris sekolah. Tampilan untuk ${ROLE_LABEL[role.primary]}.`}
        actions={
          <>
            <Link
              to="/sch/$sekolah/aset/daftar"
              params={{ sekolah }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 border border-border bg-transparent hover:bg-muted"
            >
              <span className="h-4 w-4 mr-1.5"><IconLayers /></span>
              Daftar Aset
            </Link>
            <Button onClick={() => setShowCreate(true)}>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Tambah Aset
            </Button>
          </>
        }
      />

      <PageGuide
        storageId="aset-dashboard"
        storageNamespace="aset-guide:"
        title={ASET_PAGE_GUIDES.dashboard.title}
        intro={ASET_PAGE_GUIDES.dashboard.intro}
        steps={ASET_PAGE_GUIDES.dashboard.steps}
        tips={ASET_PAGE_GUIDES.dashboard.tips}
        roleLabels={ROLE_LABEL}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Aset"
          value={stats.totalAset}
          hint={asetQ.isLoading ? "memuat..." : `${stats.totalUnit} unit`}
          icon={<IconLayers />}
          accent="brand"
          urgency="normal"
          actionHref="/sch/$sekolah/aset/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Unit Dipinjam"
          value={stats.unitDipinjam}
          hint={`utilisasi ${stats.utilisasiPct}%`}
          icon={<IconCheck />}
          accent="emerald"
          urgency="normal"
        />
        <StatCard
          label="Peminjaman Terlambat"
          value={terlambat}
          hint={terlambat > 0 ? "perlu ditagih" : "aman"}
          icon={<IconClock />}
          accent={terlambat > 0 ? "rose" : "emerald"}
          urgency={terlambat > 0 ? "critical" : "normal"}
          actionHref="/sch/$sekolah/aset/peminjaman"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Maintenance Terbuka"
          value={maintenanceTerbuka}
          hint={`${stats.asetMaintenance} aset terkunci`}
          icon={<IconSettings />}
          accent={maintenanceTerbuka > 0 ? "amber" : "emerald"}
          urgency={maintenanceTerbuka > 0 ? "warn" : "normal"}
          actionHref="/sch/$sekolah/aset/maintenance"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <ModuleFlow
        title="Alur Manajemen Aset"
        description="Dari setup master sampai pemeliharaan inventaris."
        steps={FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/sch/$sekolah/aset/daftar"} params={{ sekolah }}>{children}</Link>
        )}
      />

      <SectionCard title="Perlu Perhatian" description="Hal yang butuh tindak lanjut.">
        <AttentionList
          items={perluPerhatian}
          renderLink={(href, children) => (
            <Link to={href as "/sch/$sekolah/aset/peminjaman"} params={{ sekolah }}>{children}</Link>
          )}
        />
      </SectionCard>

      <SectionCard
        title="Aset Terbaru"
        description="Aset yang baru tercatat."
        action={
          <Link to="/sch/$sekolah/aset/daftar" params={{ sekolah }} className="text-xs text-brand hover:underline">
            Lihat semua
          </Link>
        }
      >
        {asetQ.isLoading ? (
          <div className="text-sm text-muted-fg">Memuat data...</div>
        ) : asetQ.isError ? (
          <div className="text-sm text-rose-600">Gagal memuat data.</div>
        ) : recent.length === 0 ? (
          <div className="text-sm text-muted-fg">Belum ada aset.</div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((a) => (
              <li key={a.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-fg">
                  <span className="h-4 w-4"><IconLayers /></span>
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/sch/$sekolah/aset/daftar/$name"
                    params={{ sekolah, name: a.name }}
                    className="font-medium text-fg hover:text-brand truncate block"
                  >
                    {a.nama ?? a.name}
                  </Link>
                  <div className="text-xs text-muted-fg truncate">
                    {[a.kategori, `${a.jumlah_tersedia ?? 0}/${a.jumlah_total ?? 0} tersedia`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <Badge tone={asetStatusTone(a.status)} dot>{a.status ?? "—"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <AsetFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/aset/")({ component: AsetDashboardPage });
