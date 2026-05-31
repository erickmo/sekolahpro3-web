import { useMemo } from "react";
import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import {
  AttentionList,
  Badge,
  Button,
  PageHeader,
  SectionCard,
  StatCard,
  IconBook,
  IconCheck,
  IconAlert,
  IconEdit,
  IconFile,
  IconGrad,
  IconSettings,
  IconChart,
  GlossaryTooltip,
  ModuleFlow,
} from "@sekolahpro/ui";
import type { AttentionItem, ModuleFlowStep } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../lib/glossary";
import { useAkademikContextOptional } from "../lib/akademikContext";

type Mapel = {
  name: string;
  nama_mapel: string;
  kode_mapel: string;
  kelompok_mapel?: string;
  modified?: string;
};
type Kkm = { name: string; mata_pelajaran: string };
type Kurikulum = { name: string; nama?: string; is_aktif?: 0 | 1 };
type Komponen = { name: string; mata_pelajaran?: string };
type TahunAjaran = {
  name: string;
  nama?: string;
  is_current?: 0 | 1;
  semester_ganjil_akhir?: string;
  semester_genap_akhir?: string;
};

const MAPEL_FIELDS = ["name", "nama_mapel", "kode_mapel", "kelompok_mapel", "modified"];
const KKM_FIELDS = ["name", "mata_pelajaran"];
const KURIKULUM_FIELDS = ["name", "nama", "is_aktif"];
const KOMPONEN_FIELDS = ["name", "mata_pelajaran"];
const TA_FIELDS = ["name", "nama", "is_current", "semester_ganjil_akhir", "semester_genap_akhir"];

const PAGE_LIMIT = 200;
const RECENT_LIMIT = 5;
const ATTENTION_CAP = 20;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysUntil(target: Date, from: Date): number {
  return Math.max(0, Math.ceil((target.getTime() - from.getTime()) / MS_PER_DAY));
}

function parseDateOrNull(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

type QuickAction = {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: "brand" | "emerald" | "violet" | "amber" | "rose" | "sky";
};

// Alur penilaian: langkah setup (kurikulum→komponen) kini di Master Data,
// langkah operasional (input test→entri→raport) tetap di modul Akademik.
const AKADEMIK_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "kurikulum", label: "Kurikulum", hint: "Tetapkan kurikulum aktif", href: "/sch/$sekolah/master/kurikulum" },
  { key: "mapel", label: "Mata Pelajaran", hint: "Daftar mapel & kode", href: "/sch/$sekolah/master/mapel" },
  { key: "kkm", label: "KKM", hint: "Ketuntasan minimal", href: "/sch/$sekolah/master/kkm" },
  { key: "komponen", label: "Komponen Nilai", hint: "Bobot per komponen", href: "/sch/$sekolah/master/komponen-nilai" },
  { key: "asesmen", label: "Input Nilai Test", hint: "Nilai per test/ulangan", href: "/sch/$sekolah/akademik/asesmen" },
  { key: "entri", label: "Entri Nilai", hint: "Input nilai siswa", href: "/sch/$sekolah/akademik/entri-nilai" },
  { key: "raport", label: "Raport", hint: "Susun & cetak raport", href: "/sch/$sekolah/akademik/raport" },
];

const QUICK_ACTIONS: QuickAction[] = [
  { to: "/sch/$sekolah/akademik/asesmen", label: "Input Nilai Test", description: "Input nilai satu test untuk satu kelas, cepat.", icon: <IconEdit />, accent: "brand" },
  { to: "/sch/$sekolah/akademik/entri-nilai", label: "Entri Nilai", description: "Rekap nilai per siswa × komponen.", icon: <IconChart />, accent: "sky" },
  { to: "/sch/$sekolah/akademik/raport", label: "Raport", description: "Susun & cetak raport siswa.", icon: <IconFile />, accent: "emerald" },
  { to: "/sch/$sekolah/master/kkm", label: "KKM", description: "Atur Kriteria Ketuntasan Minimal.", icon: <IconCheck />, accent: "amber" },
  { to: "/sch/$sekolah/master/komponen-nilai", label: "Komponen Nilai", description: "Definisikan bobot komponen penilaian.", icon: <IconChart />, accent: "violet" },
  { to: "/sch/$sekolah/master/kurikulum", label: "Kurikulum", description: "Kelola kurikulum & struktur mapel.", icon: <IconGrad />, accent: "sky" },
  { to: "/sch/$sekolah/master/konfigurasi", label: "Konfigurasi", description: "Pengaturan modul akademik.", icon: <IconSettings />, accent: "rose" },
];

function AkademikDashboardPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const ctx = useAkademikContextOptional();
  const now = useMemo(() => new Date(), []);

  const mapelQ = useResourceList<Mapel>("Mata Pelajaran", {
    fields: MAPEL_FIELDS,
    order_by: "`modified` desc",
    limit_page_length: PAGE_LIMIT,
  });
  const kkmQ = useResourceList<Kkm>("KKM", {
    fields: KKM_FIELDS,
    order_by: "`mata_pelajaran` asc",
    limit_page_length: PAGE_LIMIT,
  });
  const kurikulumQ = useResourceList<Kurikulum>("Kurikulum", {
    fields: KURIKULUM_FIELDS,
    order_by: "`modified` desc",
    limit_page_length: PAGE_LIMIT,
  });
  const komponenQ = useResourceList<Komponen>("Komponen Nilai", {
    fields: KOMPONEN_FIELDS,
    order_by: "`mata_pelajaran` asc",
    limit_page_length: PAGE_LIMIT,
  });
  const taQ = useResourceList<TahunAjaran>("Tahun Ajaran", {
    fields: TA_FIELDS,
    filters: ctx?.tahunAjaran
      ? [["name", "=", ctx.tahunAjaran]]
      : [["is_current", "=", 1]],
    limit_page_length: 1,
  });

  const mapelList = mapelQ.data ?? [];
  const kkmList = kkmQ.data ?? [];
  const kurikulumList = kurikulumQ.data ?? [];
  const komponenList = komponenQ.data ?? [];
  const activeTA = taQ.data?.[0];

  const cutoff = useMemo(() => {
    if (!activeTA) return null;
    const semester = ctx?.semester;
    if (semester === "Genap") return parseDateOrNull(activeTA.semester_genap_akhir);
    if (semester === "Ganjil") return parseDateOrNull(activeTA.semester_ganjil_akhir);
    const ganjil = parseDateOrNull(activeTA.semester_ganjil_akhir);
    const genap = parseDateOrNull(activeTA.semester_genap_akhir);
    const upcoming = [ganjil, genap].filter((d): d is Date => d !== null && d >= now);
    if (upcoming.length === 0) return null;
    return upcoming.sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  }, [activeTA, ctx?.semester, now]);

  const stats = useMemo(() => {
    const totalMapel = mapelList.length;
    const mapelDenganKkm = new Set(kkmList.map((k) => k.mata_pelajaran));
    const kkmBelumDiatur = mapelList.filter((m) => !mapelDenganKkm.has(m.name)).length;
    const kurikulumAktif = kurikulumList.filter((k) => k.is_aktif === 1).length;
    return { totalMapel, kkmBelumDiatur, kurikulumAktif };
  }, [mapelList, kkmList, kurikulumList]);

  const cutOffDays = cutoff ? daysUntil(cutoff, now) : null;
  const cutOffUrgency: "normal" | "warn" | "critical" =
    cutOffDays === null
      ? "normal"
      : cutOffDays <= 7
        ? "critical"
        : cutOffDays <= 14
          ? "warn"
          : "normal";

  const renderStatLink = (href: string, children: React.ReactNode) => <Link to={href}>{children}</Link>;

  const perluPerhatianItems = useMemo<AttentionItem[]>(() => {
    const kkmSet = new Set(kkmList.map((k) => k.mata_pelajaran));
    const komponenSet = new Set(komponenList.map((k) => k.mata_pelajaran).filter(Boolean));
    const items: AttentionItem[] = [];

    if (cutOffDays !== null && cutOffDays <= 14) {
      items.push({
        id: "cutoff-raport",
        label: `Cut-off raport dalam ${cutOffDays} hari`,
        description: "Pastikan entri nilai selesai sebelum batas waktu.",
        tone: cutOffDays <= 7 ? "danger" : "warning",
        badge: "Cut-off",
        actionLabel: "Buka Entri Nilai",
        actionHref: "/sch/$sekolah/akademik/entri-nilai",
      });
    }

    for (const m of mapelList) {
      if (items.length >= ATTENTION_CAP) break;
      if (!kkmSet.has(m.name)) {
        items.push({
          id: `kkm-${m.name}`,
          label: m.nama_mapel,
          description: `${m.kode_mapel} · belum ada KKM`,
          tone: "danger",
          badge: "KKM",
          actionLabel: "Atur KKM",
          actionHref: "/sch/$sekolah/master/kkm",
        });
      }
      if (items.length >= ATTENTION_CAP) break;
      if (!komponenSet.has(m.name)) {
        items.push({
          id: `komponen-${m.name}`,
          label: m.nama_mapel,
          description: `${m.kode_mapel} · belum ada komponen nilai`,
          tone: "warning",
          badge: "Komponen",
          actionLabel: "Atur Komponen",
          actionHref: "/sch/$sekolah/master/komponen-nilai",
        });
      }
    }
    return items;
  }, [mapelList, kkmList, komponenList, cutOffDays]);

  const aktivitasTerbaru = mapelList.slice(0, RECENT_LIMIT);

  const anyLoading =
    mapelQ.isLoading || kkmQ.isLoading || kurikulumQ.isLoading || komponenQ.isLoading;
  const anyError =
    mapelQ.isError || kkmQ.isError || kurikulumQ.isError || komponenQ.isError;
  const refetchAll = () => {
    void mapelQ.refetch();
    void kkmQ.refetch();
    void kurikulumQ.refetch();
    void komponenQ.refetch();
    void taQ.refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik"
        title="Dashboard Akademik"
        description={
          <>
            Ringkasan mapel, <GlossaryTooltip term="KKM" definition={GLOSSARY.KKM} />, kurikulum,
            dan progres penilaian.
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cut-off Raport"
          value={cutOffDays !== null ? `${cutOffDays} hari` : "—"}
          hint={
            cutoff
              ? `tersisa s/d ${cutoff.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
              : "TA aktif belum punya semester_*_akhir"
          }
          icon={<IconBook />}
          accent="brand"
          urgency={cutOffUrgency}
        />
        <StatCard
          label={
            <>
              <GlossaryTooltip term="KKM" definition={GLOSSARY.KKM} /> Belum Diatur
            </>
          }
          value={stats.kkmBelumDiatur.toLocaleString("id-ID")}
          hint="mapel tanpa KKM"
          icon={<IconAlert />}
          accent="amber"
          urgency="warn"
          actionHref="/sch/$sekolah/master/kkm"
          renderLink={renderStatLink}
        />
        <StatCard
          label="Kurikulum Aktif"
          value={stats.kurikulumAktif.toLocaleString("id-ID")}
          hint={`dari ${kurikulumList.length} total`}
          icon={<IconGrad />}
          accent="emerald"
          urgency="normal"
        />
        <StatCard
          label="% Sel Nilai Terisi"
          value="—"
          hint="Belum tersedia · butuh endpoint progres entri nilai"
          icon={<IconEdit />}
          accent="violet"
          urgency="normal"
          actionHref="/sch/$sekolah/akademik/entri-nilai"
          renderLink={renderStatLink}
        />
      </div>

      <ModuleFlow
        title="Alur Penilaian Akademik"
        description="Langkah dari setup kurikulum sampai raport terbit."
        steps={AKADEMIK_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/sch/$sekolah/master/kurikulum"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

      <SectionCard title="Aksi Cepat" description="Pintasan ke alur kerja akademik utama.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex items-start gap-3 rounded-lg border border-border bg-bg p-4 hover:border-brand hover:shadow-sm transition"
            >
              <div className="h-9 w-9 shrink-0 rounded-md bg-muted flex items-center justify-center text-fg group-hover:text-brand">
                <span className="h-5 w-5">{a.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="font-medium text-fg group-hover:text-brand">{a.label}</div>
                <div className="text-xs text-muted-fg mt-0.5">{a.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Perlu Perhatian"
          description="Mapel tanpa KKM, komponen nilai, atau cut-off raport dekat."
          action={
            perluPerhatianItems.length > 0 ? (
              <Badge tone="warning">{perluPerhatianItems.length} item</Badge>
            ) : null
          }
        >
          {anyLoading ? (
            <PerhatianSkeleton />
          ) : anyError ? (
            <ErrorRetry onRetry={refetchAll} />
          ) : (
            <AttentionList
              items={perluPerhatianItems}
              maxItems={5}
              renderLink={(href, children, className) => (
                <Link to={href} className={className}>
                  {children}
                </Link>
              )}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Aktivitas Terbaru"
          description="Mata pelajaran terakhir diperbarui."
          action={
            <Link to="/sch/$sekolah/master/mapel" params={{ sekolah }} className="text-xs text-brand hover:underline">
              Lihat semua
            </Link>
          }
        >
          {anyLoading ? (
            <PerhatianSkeleton />
          ) : anyError ? (
            <ErrorRetry onRetry={refetchAll} />
          ) : aktivitasTerbaru.length === 0 ? (
            <div className="text-sm text-muted-fg">Belum ada mata pelajaran.</div>
          ) : (
            <ul className="divide-y divide-border -my-2">
              {aktivitasTerbaru.map((m) => (
                <li key={m.name} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-fg truncate">{m.nama_mapel}</div>
                    <div className="text-xs text-muted-fg">
                      <span className="font-mono">{m.kode_mapel}</span>
                      {m.kelompok_mapel ? ` · ${m.kelompok_mapel}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function PerhatianSkeleton() {
  return (
    <div className="space-y-2 animate-pulse" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-9 rounded bg-muted" />
      ))}
    </div>
  );
}

function ErrorRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
      <div className="text-sm text-rose-700">Gagal memuat data.</div>
      <Button variant="outline" onClick={onRetry}>
        Coba lagi
      </Button>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/")({ component: AkademikDashboardPage });
