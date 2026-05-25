import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AttentionList,
  Badge,
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
} from "@sekolahpro/ui";
import type { AttentionItem } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../lib/glossary";

type Mapel = {
  name: string;
  nama_mapel: string;
  kode_mapel: string;
  kelompok?: string;
  jenjang?: string;
  status?: string;
  modified?: string;
};
type Kkm = { name: string; mata_pelajaran: string; nilai_kkm: number };
type Kurikulum = { name: string; nama_kurikulum?: string; status?: string };
type Komponen = { name: string; mata_pelajaran?: string };

const MAPEL_FIELDS = ["name", "nama_mapel", "kode_mapel", "kelompok", "jenjang", "status", "modified"];
const KKM_FIELDS = ["name", "mata_pelajaran", "nilai_kkm"];
const KURIKULUM_FIELDS = ["name", "nama_kurikulum", "status"];
const KOMPONEN_FIELDS = ["name", "mata_pelajaran"];

const PAGE_LIMIT = 200;
const RECENT_LIMIT = 5;

// COO actionable KPI: jumlah hari sampai cut-off raport.
// TODAY hardcoded supaya dashboard deterministic untuk demo/QA.
const RAPORT_CUT_OFF = new Date("2026-06-15");
const TODAY = new Date("2026-05-25");
const MS_PER_DAY = 1000 * 60 * 60 * 24;
function daysUntil(target: Date, from: Date = TODAY): number {
  return Math.max(0, Math.ceil((target.getTime() - from.getTime()) / MS_PER_DAY));
}

// Stub: % sel nilai terisi (entri-nilai progress).
// TODO(/akademik/entri-nilai): hitung dari (entri terisi)/(mapel * komponen * siswa).
const STUB_ENTRI_NILAI_PERCENT = 64;

type QuickAction = {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: "brand" | "emerald" | "violet" | "amber" | "rose" | "sky";
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    to: "/akademik/entri-nilai",
    label: "Entri Nilai",
    description: "Input nilai harian, UTS, dan UAS.",
    icon: <IconEdit />,
    accent: "brand",
  },
  {
    to: "/akademik/raport",
    label: "Raport",
    description: "Susun & cetak raport siswa.",
    icon: <IconFile />,
    accent: "emerald",
  },
  {
    to: "/akademik/kkm",
    label: "KKM",
    description: "Atur Kriteria Ketuntasan Minimal.",
    icon: <IconCheck />,
    accent: "amber",
  },
  {
    to: "/akademik/komponen-nilai",
    label: "Komponen Nilai",
    description: "Definisikan bobot komponen penilaian.",
    icon: <IconChart />,
    accent: "violet",
  },
  {
    to: "/akademik/kurikulum",
    label: "Kurikulum",
    description: "Kelola kurikulum & struktur mapel.",
    icon: <IconGrad />,
    accent: "sky",
  },
  {
    to: "/akademik/konfigurasi",
    label: "Konfigurasi",
    description: "Pengaturan modul akademik.",
    icon: <IconSettings />,
    accent: "rose",
  },
];

function AkademikDashboardPage() {
  const mapelQ = useResourceList<Mapel>("Mata Pelajaran", {
    fields: MAPEL_FIELDS,
    filters: [["status", "=", "Aktif"]],
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

  const mapelList = mapelQ.data ?? [];
  const kkmList = kkmQ.data ?? [];
  const kurikulumList = kurikulumQ.data ?? [];
  const komponenList = komponenQ.data ?? [];

  const stats = useMemo(() => {
    const totalMapel = mapelList.length;
    const mapelDenganKkm = new Set(kkmList.map((k) => k.mata_pelajaran));
    const kkmBelumDiatur = mapelList.filter((m) => !mapelDenganKkm.has(m.name)).length;
    const kurikulumAktif = kurikulumList.filter(
      (k) => (k.status ?? "").toLowerCase() === "aktif",
    ).length;
    const mapelDenganKomponen = new Set(
      komponenList.map((k) => k.mata_pelajaran).filter(Boolean),
    );
    const entriNilaiPending = mapelList.filter(
      (m) => mapelDenganKkm.has(m.name) && mapelDenganKomponen.has(m.name),
    ).length;
    const cutOffDays = daysUntil(RAPORT_CUT_OFF);
    const entriNilaiPercent = STUB_ENTRI_NILAI_PERCENT;
    return { totalMapel, kkmBelumDiatur, kurikulumAktif, entriNilaiPending, cutOffDays, entriNilaiPercent };
  }, [mapelList, kkmList, kurikulumList, komponenList]);

  const cutOffUrgency: "normal" | "warn" | "critical" =
    stats.cutOffDays <= 7 ? "critical" : stats.cutOffDays <= 14 ? "warn" : "normal";
  const entriNilaiUrgency: "normal" | "warn" | "critical" =
    stats.entriNilaiPercent < 50 ? "critical" : stats.entriNilaiPercent < 80 ? "warn" : "normal";
  const renderStatLink = (href: string, children: React.ReactNode) => (
    <Link to={href}>{children}</Link>
  );

  const perluPerhatianItems = useMemo<AttentionItem[]>(() => {
    const kkmSet = new Set(kkmList.map((k) => k.mata_pelajaran));
    const komponenSet = new Set(komponenList.map((k) => k.mata_pelajaran).filter(Boolean));
    const items: AttentionItem[] = [];

    // Cut-off raport row — warning when ≤14 days, critical when ≤7 days.
    if (stats.cutOffDays <= 14) {
      items.push({
        id: "cutoff-raport",
        label: `Cut-off raport dalam ${stats.cutOffDays} hari`,
        description: "Pastikan entri nilai selesai sebelum batas waktu.",
        tone: stats.cutOffDays <= 7 ? "danger" : "warning",
        badge: "Cut-off",
        actionLabel: "Buka Entri Nilai",
        actionHref: "/akademik/entri-nilai",
      });
    }

    for (const m of mapelList) {
      if (!kkmSet.has(m.name)) {
        items.push({
          id: `kkm-${m.name}`,
          label: m.nama_mapel,
          description: `${m.kode_mapel} · belum ada KKM`,
          tone: "danger",
          badge: "KKM",
          actionLabel: "Atur KKM",
          actionHref: "/akademik/kkm",
        });
      }
      if (!komponenSet.has(m.name)) {
        items.push({
          id: `komponen-${m.name}`,
          label: m.nama_mapel,
          description: `${m.kode_mapel} · belum ada komponen nilai`,
          tone: "warning",
          badge: "Komponen",
          actionLabel: "Atur Komponen",
          actionHref: "/akademik/komponen-nilai",
        });
      }
    }
    return items;
  }, [mapelList, kkmList, komponenList, stats.cutOffDays]);

  const aktivitasTerbaru = mapelList.slice(0, RECENT_LIMIT);

  const anyLoading =
    mapelQ.isLoading || kkmQ.isLoading || kurikulumQ.isLoading || komponenQ.isLoading;
  const anyError = mapelQ.isError || kkmQ.isError || kurikulumQ.isError || komponenQ.isError;

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
          value={`${stats.cutOffDays} hari`}
          hint={`tersisa s/d ${RAPORT_CUT_OFF.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
          icon={<IconBook />}
          accent="brand"
          urgency={cutOffUrgency}
        />
        <StatCard
          label={<><GlossaryTooltip term="KKM" definition={GLOSSARY.KKM} /> Belum Diatur</>}
          value={stats.kkmBelumDiatur.toLocaleString("id-ID")}
          hint="mapel tanpa KKM"
          icon={<IconAlert />}
          accent="amber"
          urgency="warn"
          actionHref="/akademik/kkm"
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
          value={`${stats.entriNilaiPercent}%`}
          hint="progres entri nilai"
          icon={<IconEdit />}
          accent="violet"
          urgency={entriNilaiUrgency}
          actionHref="/akademik/entri-nilai"
          renderLink={renderStatLink}
        />
      </div>

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
            <div className="text-sm text-muted-fg">Memuat data...</div>
          ) : anyError ? (
            <div className="text-sm text-rose-600">Gagal memuat data.</div>
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
            <Link to="/akademik/daftar" className="text-xs text-brand hover:underline">
              Lihat semua
            </Link>
          }
        >
          {anyLoading ? (
            <div className="text-sm text-muted-fg">Memuat data...</div>
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
                      {m.kelompok ? ` · ${m.kelompok}` : ""}
                      {m.jenjang ? ` · ${m.jenjang}` : ""}
                    </div>
                  </div>
                  <Badge tone={m.status === "Aktif" ? "success" : "neutral"} dot>
                    {m.status ?? "—"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/akademik/")({ component: AkademikDashboardPage });
