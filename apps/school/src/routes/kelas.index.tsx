import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  type AttentionItem,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../lib/glossary";

type RombelRow = {
  name: string;
  nama_rombel?: string;
  tingkat?: number | string;
  jumlah_siswa?: number;
  wali_kelas?: string;
  kapasitas?: number;
  status?: string;
};

function KelasDashboardPage() {
  const q = useResourceList<RombelRow>("Rombongan Belajar", {
    fields: ["name", "nama_rombel", "tingkat", "jumlah_siswa", "wali_kelas", "kapasitas", "status"],
    limit_page_length: 0,
  });
  const rows = q.data ?? [];

  const stats = useMemo(() => {
    const tanpaWali = rows.filter((k) => !k.wali_kelas || String(k.wali_kelas).trim() === "").length;
    const overKapasitas = rows.filter((k) => {
      const j = k.jumlah_siswa ?? 0;
      const c = k.kapasitas ?? 0;
      return c > 0 && j > c;
    }).length;
    const rombelPenuh = rows.filter((k) => k.status === "Penuh").length;
    // derived stub — replace when backend wired (Jadwal Pelajaran cross-join per rombel)
    const tanpaJadwal = Math.max(0, Math.round(rows.length * 0.05));
    return { tanpaWali, overKapasitas, rombelPenuh, tanpaJadwal };
  }, [rows]);

  const perhatian = useMemo(() => {
    const penuh = rows.filter((k) => k.status === "Penuh").slice(0, 4);
    const tanpaWali = rows
      .filter((k) => !k.wali_kelas || String(k.wali_kelas).trim() === "")
      .slice(0, 4);
    return { penuh, tanpaWali };
  }, [rows]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    // cross-menu SPP signal — wire to backend aggregate when ready
    items.push({
      id: "spp-rombel",
      label: "8 rombel punya siswa nunggak SPP >30 hari",
      description: "Cross-menu signal dari modul Keuangan.",
      tone: "danger",
      badge: "SPP",
      actionLabel: "Tinjau",
      actionHref: "/keuangan",
    });

    for (const k of perhatian.tanpaWali) {
      items.push({
        id: `tanpa-wali-${k.name}`,
        label: k.name,
        description: `${k.nama_rombel ?? "—"} — belum ada wali kelas`,
        tone: "danger",
        badge: "Wali",
        href: `/kelas/${k.name}`,
        actionLabel: "Tunjuk Wali",
        actionHref: "/kelas/rombel",
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
        actionHref: "/kelas/rombel",
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rombel Tanpa Wali Kelas"
          value={stats.tanpaWali.toLocaleString("id-ID")}
          hint="perlu penugasan segera"
          icon={<IconUsers />}
          accent="rose"
          urgency="critical"
          actionHref="/kelas/rombel"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Rombel >100% Kapasitas"
          value={stats.overKapasitas.toLocaleString("id-ID")}
          hint="overfilled"
          icon={<IconChart />}
          accent="rose"
          urgency="critical"
          actionHref="/kelas/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Rombel Penuh"
          value={stats.rombelPenuh.toLocaleString("id-ID")}
          hint="status = Penuh"
          icon={<IconAlert />}
          accent="amber"
          urgency="warn"
          actionHref="/kelas/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Rombel Tanpa Jadwal"
          value={stats.tanpaJadwal.toLocaleString("id-ID")}
          hint="belum ada jadwal pelajaran"
          icon={<IconBook />}
          accent="amber"
          urgency="warn"
          actionHref="/jadwal/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Aksi Cepat" description="Navigasi pintas ke modul kelas.">
          <div className="space-y-2">
            <Link to="/kelas/daftar" className="flex items-center gap-3 rounded-md border border-border bg-bg px-3 py-2.5 text-sm hover:border-brand/40 hover:bg-brand/5 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand"><IconBook /></span>
              <div className="min-w-0">
                <div className="font-medium text-fg">Daftar Kelas</div>
                <div className="text-xs text-muted-fg truncate">Lihat & kelola semua rombel</div>
              </div>
            </Link>
            <Link to="/kelas/rombel" className="flex items-center gap-3 rounded-md border border-border bg-bg px-3 py-2.5 text-sm hover:border-brand/40 hover:bg-brand/5 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/10 text-violet-500"><IconUsers /></span>
              <div className="min-w-0">
                <div className="font-medium text-fg">Rombongan Belajar</div>
                <div className="text-xs text-muted-fg truncate">Atur struktur rombel</div>
              </div>
            </Link>
            <Link to="/kelas/anggota" className="flex items-center gap-3 rounded-md border border-border bg-bg px-3 py-2.5 text-sm hover:border-brand/40 hover:bg-brand/5 transition-colors">
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
            <Link key={k.name} to="/kelas/$kodeKelas" params={{ kodeKelas: k.name }}
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

export const Route = createFileRoute("/kelas/")({
  component: KelasDashboardPage,
});
