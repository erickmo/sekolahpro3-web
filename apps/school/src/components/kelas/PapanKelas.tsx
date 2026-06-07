/**
 * Papan Kelas — the Tata Usaha (default) surface of the role-sliced Kelas module.
 *
 * This is the structure-builder board the TU lands on at /kelas. For now it is
 * the original Kelas dashboard (stat wall + setup flow + attention list), moved
 * here verbatim from the route so the index becomes a thin role switch. Phase 1
 * evolves this into the fix-it-tray board (Tanpa Wali / Over-Penuh / Belum
 * Berkelas) with a TA selector and zero-config inline actions.
 */
import { useMemo } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  AttentionList,
  PageHeader,
  SectionCard,
  StatCard,
  IconAlert,
  IconBook,
  IconChart,
  IconCheck,
  IconUsers,
  GlossaryTooltip,
  ModuleFlow,
  type ModuleFlowStep,
  type AttentionItem,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../../lib/glossary";
import { PageGuide } from "../guide";
import { KELAS_PAGE_GUIDES } from "./pageGuides";
import { SCHOOL_ROLE_LABEL } from "../../lib/schoolGuideRole";

const KELAS_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "rombel", label: "Buat Rombel", hint: "Definisi struktur kelas", href: "/sch/$sekolah/kelas/rombel" },
  { key: "wali", label: "Tunjuk Wali Kelas", hint: "Assign wali per rombel", href: "/sch/$sekolah/kelas/daftar" },
  { key: "anggota", label: "Isi Anggota", hint: "Masukkan siswa", href: "/sch/$sekolah/kelas/anggota" },
  { key: "jadwal", label: "Buat Jadwal", hint: "Susun jadwal pelajaran", href: "/sch/$sekolah/jadwal/daftar" },
];

type RombelRow = {
  name: string;
  nama_rombel?: string;
  tingkat?: number | string;
  jumlah_siswa?: number;
  wali_kelas?: string;
  kapasitas?: number;
  status?: string;
};

export function PapanKelas() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const q = useResourceList<RombelRow>("Rombongan Belajar", {
    fields: ["name", "nama_rombel", "tingkat", "jumlah_siswa", "wali_kelas", "kapasitas", "status"],
    limit_page_length: 0,
  });
  const jadwalQ = useResourceList<{ rombel?: string }>("Jadwal Pelajaran", {
    fields: ["rombel"],
    filters: [["is_aktif", "=", 1]],
    limit_page_length: 0,
  });
  const rows = q.data ?? [];
  const rombelDenganJadwal = useMemo(() => {
    const set = new Set<string>();
    for (const j of jadwalQ.data ?? []) {
      if (j.rombel) set.add(j.rombel);
    }
    return set;
  }, [jadwalQ.data]);
  const tanpaJadwalCount = rows.filter((k) => k.status === "Aktif" && !rombelDenganJadwal.has(k.name)).length;

  // Real count: rombel yang status Aktif tapi penuh (jumlah_siswa >= kapasitas, kapasitas > 0).
  const stats = useMemo(() => {
    const tanpaWali = rows.filter((k) => !k.wali_kelas || String(k.wali_kelas).trim() === "").length;
    const overKapasitas = rows.filter((k) => {
      const j = k.jumlah_siswa ?? 0;
      const c = k.kapasitas ?? 0;
      return c > 0 && j > c;
    }).length;
    const rombelPenuh = rows.filter((k) => {
      const j = k.jumlah_siswa ?? 0;
      const c = k.kapasitas ?? 0;
      return c > 0 && j >= c && k.status === "Aktif";
    }).length;
    const rombelDitutup = rows.filter((k) => k.status === "Ditutup").length;
    return { tanpaWali, overKapasitas, rombelPenuh, rombelDitutup };
  }, [rows]);

  const perhatian = useMemo(() => {
    const penuh = rows
      .filter((k) => {
        const j = k.jumlah_siswa ?? 0;
        const c = k.kapasitas ?? 0;
        return c > 0 && j >= c && k.status === "Aktif";
      })
      .slice(0, 4);
    const tanpaWali = rows
      .filter((k) => !k.wali_kelas || String(k.wali_kelas).trim() === "")
      .slice(0, 4);
    return { penuh, tanpaWali };
  }, [rows]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    for (const k of perhatian.tanpaWali) {
      items.push({
        id: `tanpa-wali-${k.name}`,
        label: k.name,
        description: `${k.nama_rombel ?? "—"} — belum ada wali kelas`,
        tone: "danger",
        badge: "Wali",
        href: `/kelas/${k.name}`,
        actionLabel: "Tunjuk Wali",
        actionHref: "/sch/$sekolah/kelas/rombel",
      });
    }

    for (const k of perhatian.penuh) {
      const cap = k.kapasitas ?? 0;
      const isi = k.jumlah_siswa ?? 0;
      const over = cap > 0 && isi > cap;
      items.push({
        id: `penuh-${k.name}`,
        label: k.name,
        description: `${k.nama_rombel ?? "—"} · ${isi}${cap ? `/${cap}` : ""}`,
        tone: over ? "danger" : "warning",
        badge: "Penuh",
        href: `/kelas/${k.name}`,
        actionLabel: "Atur Kapasitas",
        actionHref: "/sch/$sekolah/kelas/rombel",
      });
    }

    return items;
  }, [perhatian]);

  const aktivitas = useMemo(() => rows.slice(0, 5), [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik"
        title="Dashboard Kelas & Rombel"
        description={
          <>
            Ringkasan kondisi <GlossaryTooltip term="Rombel" definition={GLOSSARY.Rombel} />,
            kapasitas, dan rombel yang perlu perhatian.
          </>
        }
      />

      <PageGuide
        storageNamespace="kelas-guide:"
        storageId="dashboard"
        title={KELAS_PAGE_GUIDES.dashboard.title}
        intro={KELAS_PAGE_GUIDES.dashboard.intro}
        steps={KELAS_PAGE_GUIDES.dashboard.steps}
        tips={KELAS_PAGE_GUIDES.dashboard.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rombel Tanpa Wali Kelas"
          value={stats.tanpaWali.toLocaleString("id-ID")}
          hint="perlu penugasan segera"
          icon={<IconUsers />}
          accent="rose"
          urgency="critical"
          actionHref="/sch/$sekolah/kelas/rombel"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Rombel >100% Kapasitas"
          value={stats.overKapasitas.toLocaleString("id-ID")}
          hint="overfilled"
          icon={<IconChart />}
          accent="rose"
          urgency="critical"
          actionHref="/sch/$sekolah/kelas/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Rombel Penuh"
          value={stats.rombelPenuh.toLocaleString("id-ID")}
          hint="kapasitas tercapai"
          icon={<IconAlert />}
          accent="amber"
          urgency="warn"
          actionHref="/sch/$sekolah/kelas/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Rombel Tanpa Jadwal"
          value={tanpaJadwalCount.toLocaleString("id-ID")}
          hint="rombel aktif tanpa jadwal aktif"
          icon={<IconBook />}
          accent="amber"
          urgency="warn"
          actionHref="/sch/$sekolah/jadwal/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <ModuleFlow
        title="Alur Setup Kelas"
        description="Langkah membentuk rombel sampai siap berjalan."
        steps={KELAS_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/sch/$sekolah/kelas/rombel"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Aksi Cepat" description="Navigasi pintas ke modul kelas.">
          <div className="space-y-2">
            <Link to="/sch/$sekolah/kelas/daftar" params={{ sekolah }} className="flex items-center gap-3 rounded-md border border-border bg-bg px-3 py-2.5 text-sm hover:border-brand/40 hover:bg-brand/5 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand"><IconBook /></span>
              <div className="min-w-0">
                <div className="font-medium text-fg">Daftar Kelas</div>
                <div className="text-xs text-muted-fg truncate">Lihat & kelola semua rombel</div>
              </div>
            </Link>
            <Link to="/sch/$sekolah/kelas/rombel" params={{ sekolah }} className="flex items-center gap-3 rounded-md border border-border bg-bg px-3 py-2.5 text-sm hover:border-brand/40 hover:bg-brand/5 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/10 text-violet-500"><IconUsers /></span>
              <div className="min-w-0">
                <div className="font-medium text-fg">Rombongan Belajar</div>
                <div className="text-xs text-muted-fg truncate">Atur struktur rombel</div>
              </div>
            </Link>
            <Link to="/sch/$sekolah/kelas/anggota" params={{ sekolah }} className="flex items-center gap-3 rounded-md border border-border bg-bg px-3 py-2.5 text-sm hover:border-brand/40 hover:bg-brand/5 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500"><IconCheck /></span>
              <div className="min-w-0">
                <div className="font-medium text-fg">Anggota Rombel</div>
                <div className="text-xs text-muted-fg truncate">Kelola siswa per rombel</div>
              </div>
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Perlu Perhatian"
          description="Rombel penuh atau belum punya wali kelas."
          className="lg:col-span-2"
        >
          {q.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat data...</div>
          ) : (
            <AttentionList
              items={attentionItems}
              maxItems={5}
              renderLink={(href, children, className) => (
                <Link to={href} className={className}>
                  {children}
                </Link>
              )}
            />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Aktivitas Terbaru" description="5 rombel terakhir.">
        <div className="divide-y divide-border">
          {aktivitas.map((k) => (
            <Link key={k.name} to="/sch/$sekolah/kelas/$kodeKelas" params={{ sekolah, kodeKelas: k.name }}
              className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-brand/5 -mx-2 px-2 rounded transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand/15 to-violet-500/10 text-[11px] font-semibold tabular-nums text-brand">
                  {String(k.tingkat ?? "—")}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-fg truncate">{k.name}</div>
                  <div className="text-xs text-muted-fg truncate">
                    {k.nama_rombel ?? "—"}{k.wali_kelas ? ` · Wali ${k.wali_kelas}` : ""}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs tabular-nums text-muted-fg">
                  {k.jumlah_siswa ?? 0}{k.kapasitas ? `/${k.kapasitas}` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
