import { useMemo } from "react";
import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import {
  AttentionList,
  Badge,
  PageHeader,
  SectionCard,
  StatCard,
  IconCheck,
  IconUsers,
  IconAlert,
  IconClock,
  IconBook,
  IconCalendar,
  IconFile,
  ModuleFlow,
} from "@sekolahpro/ui";
import type { AttentionItem, ModuleFlowStep } from "@sekolahpro/ui";

const ABSENSI_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "jadwal", label: "Pastikan Jadwal", hint: "Slot pelajaran aktif", href: "/$sekolah/jadwal/daftar" },
  { key: "harian", label: "Absensi Harian", hint: "Wali kelas catat siswa", href: "/$sekolah/absensi/daftar" },
  { key: "pelajaran", label: "Absensi Pelajaran", hint: "Guru mapel per slot", href: "/$sekolah/absensi/pelajaran" },
  { key: "guru", label: "Absensi Guru", hint: "Kehadiran tenaga pendidik", href: "/$sekolah/absensi/guru" },
];
import { useResourceList } from "@sekolahpro/api-client";

// TODO(/absensi/): Absensi Harian header has {name, rombel, tanggal, dibuat_oleh}.
// total_hadir / total_alpa / total_izin / total_sakit live in child `detail`
// (Detail Absensi Harian). Field names below are best-guess for a future
// aggregate/view field on the header.
type AbsensiHarianRow = {
  name: string;
  tanggal: string;
  kelas?: string;
  rombel?: string;
  total_hadir?: number;
  total_alpa?: number;
  total_izin?: number;
  total_sakit?: number;
  status?: string;
};

function AbsensiDashboardPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const q = useResourceList<AbsensiHarianRow>("Absensi Harian", {
    fields: [
      "name",
      "tanggal",
      "kelas",
      "rombel",
      "total_hadir",
      "total_alpa",
      "total_izin",
      "total_sakit",
      "status",
    ],
    order_by: "tanggal desc",
    limit_page_length: 20,
  });
  const rows = q.data ?? [];

  const ringkasan = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayRows = rows.filter((r) => r.tanggal === today);
    const totHadir = todayRows.reduce((s, r) => s + (r.total_hadir ?? 0), 0);
    const totAlpa = todayRows.reduce((s, r) => s + (r.total_alpa ?? 0), 0);
    const totIzin = todayRows.reduce((s, r) => s + (r.total_izin ?? 0), 0);
    const totSakit = todayRows.reduce((s, r) => s + (r.total_sakit ?? 0), 0);
    const totalSiswa = totHadir + totAlpa + totIzin + totSakit;
    const kehadiranSiswa = totalSiswa > 0 ? (totHadir / totalSiswa) * 100 : 0;
    // Stubs (DO/risk signal):
    // TODO(/absensi/): hitung beruntun via window function/cron rollup.
    const STUB_KEHADIRAN_GURU = 92.5;
    const STUB_SISWA_ALPA_BERUNTUN = 3;
    // Kelas kehadiran <80% — derived from rows.
    const kelasUnder80 = rows.filter((r) => {
      const tot = (r.total_hadir ?? 0) + (r.total_alpa ?? 0) + (r.total_izin ?? 0) + (r.total_sakit ?? 0);
      if (tot === 0) return false;
      return ((r.total_hadir ?? 0) / tot) * 100 < 80;
    }).length;
    return {
      kehadiranSiswa,
      kehadiranGuru: STUB_KEHADIRAN_GURU,
      siswaAlpaBeruntun: STUB_SISWA_ALPA_BERUNTUN,
      kelasUnder80,
      sesiHariIni: todayRows.length,
    };
  }, [rows]);

  const persenUrgency = (p: number): "normal" | "warn" | "critical" =>
    p < 80 ? "critical" : p < 90 ? "warn" : "normal";
  const renderStatLink = (href: string, children: React.ReactNode) => (
    <Link to={href}>{children}</Link>
  );

  const perluPerhatianItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    // Kelas <80% hadir — danger; 80–89% — warning.
    const kelasIssues = rows
      .map((r) => {
        const total = (r.total_hadir ?? 0) + (r.total_alpa ?? 0) + (r.total_izin ?? 0) + (r.total_sakit ?? 0);
        const persen = total > 0 ? Math.round(((r.total_hadir ?? 0) / total) * 100) : 0;
        return { row: r, persen, total, hadir: r.total_hadir ?? 0 };
      })
      .filter((x) => x.total > 0 && x.persen < 90)
      .sort((a, b) => a.persen - b.persen);

    for (const { row, persen, total, hadir } of kelasIssues) {
      items.push({
        id: `kelas-${row.name}`,
        label: row.kelas ?? row.rombel ?? "—",
        description: `${row.tanggal} · ${hadir}/${total} hadir (${persen}%)`,
        tone: persen < 80 ? "danger" : "warning",
        badge: `${persen}%`,
        actionLabel: "Tinjau Kelas",
        actionHref: "/$sekolah/absensi/pelajaran",
      });
    }

    // Guru belum input — stub aggregate from header rows lacking status Final.
    const guruBelumInput = rows.filter(
      (r) => r.tanggal === new Date().toISOString().slice(0, 10) && r.status !== "Final",
    ).length;
    if (guruBelumInput > 0) {
      items.push({
        id: "guru-belum-input",
        label: `${guruBelumInput} sesi belum di-finalisasi guru`,
        description: "Ingatkan guru untuk menyelesaikan input absensi hari ini.",
        tone: "warning",
        badge: "Guru",
        actionLabel: "Ingatkan",
        actionHref: "/$sekolah/absensi/guru",
      });
    }

    // Siswa alpa beruntun (cross-menu to wali siswa).
    if (ringkasan.siswaAlpaBeruntun > 0) {
      items.push({
        id: "alpa-beruntun",
        label: `${ringkasan.siswaAlpaBeruntun} siswa alpa beruntun >3 hari`,
        description: "Risiko DO — hubungi wali untuk follow-up.",
        tone: "danger",
        badge: "Alpa",
        actionLabel: "Hubungi Wali",
        actionHref: "/$sekolah/siswa/wali",
      });
    }

    return items;
  }, [rows, ringkasan.siswaAlpaBeruntun]);

  const aktivitas = useMemo(() => rows.slice(0, 5), [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Absensi"
        title="Dashboard Absensi"
        description="Pantau kehadiran siswa hari ini, tindak lanjuti yang perlu perhatian."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Kehadiran Siswa Hari Ini"
          value={`${ringkasan.kehadiranSiswa.toFixed(1)}%`}
          hint={`${ringkasan.sesiHariIni} sesi tercatat`}
          icon={<IconCheck />}
          accent="emerald"
          urgency={persenUrgency(ringkasan.kehadiranSiswa)}
        />
        <StatCard
          label="Kehadiran Guru Hari Ini"
          value={`${ringkasan.kehadiranGuru.toFixed(1)}%`}
          hint="presensi tenaga pendidik"
          icon={<IconUsers />}
          accent="brand"
          urgency={persenUrgency(ringkasan.kehadiranGuru)}
          actionHref="/$sekolah/absensi/guru"
          renderLink={renderStatLink}
        />
        <StatCard
          label="Siswa Alpa Beruntun >3 hari"
          value={ringkasan.siswaAlpaBeruntun.toLocaleString("id-ID")}
          hint="risiko DO — tindak lanjut"
          icon={<IconAlert />}
          accent="rose"
          urgency="critical"
          actionHref="/$sekolah/absensi/daftar"
          renderLink={renderStatLink}
        />
        <StatCard
          label="Kelas Kehadiran <80%"
          value={ringkasan.kelasUnder80.toLocaleString("id-ID")}
          hint="sesi butuh review"
          icon={<IconClock />}
          accent="amber"
          urgency="warn"
          actionHref="/$sekolah/absensi/pelajaran"
          renderLink={renderStatLink}
        />
      </div>

      <ModuleFlow
        title="Alur Pencatatan Absensi"
        description="Urutan absensi harian: dari jadwal sampai rekap guru."
        steps={ABSENSI_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/$sekolah/absensi/daftar"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

      <SectionCard title="Aksi Cepat" description="Buka modul absensi yang sering digunakan.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Link to="/$sekolah/absensi/pelajaran" params={{ sekolah }}
            className="group rounded-lg border border-border bg-card p-4 hover:border-brand hover:bg-brand/5 transition-colors">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 flex items-center justify-center rounded-md bg-brand/10 text-brand"><IconBook /></span>
              <div className="min-w-0">
                <div className="font-medium text-fg">Input Per Pelajaran</div>
                <div className="text-xs text-muted-fg">Catat absensi setiap sesi mengajar</div>
              </div>
            </div>
          </Link>
          <Link to="/$sekolah/absensi/guru" params={{ sekolah }}
            className="group rounded-lg border border-border bg-card p-4 hover:border-brand hover:bg-brand/5 transition-colors">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 flex items-center justify-center rounded-md bg-violet-500/10 text-violet-600"><IconUsers /></span>
              <div className="min-w-0">
                <div className="font-medium text-fg">Absensi Guru</div>
                <div className="text-xs text-muted-fg">Kelola presensi tenaga pendidik</div>
              </div>
            </div>
          </Link>
          <Link to="/$sekolah/absensi/daftar" params={{ sekolah }}
            className="group rounded-lg border border-border bg-card p-4 hover:border-brand hover:bg-brand/5 transition-colors">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 flex items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600"><IconFile /></span>
              <div className="min-w-0">
                <div className="font-medium text-fg">Daftar Absensi Harian</div>
                <div className="text-xs text-muted-fg">Riwayat dan rekap per kelas</div>
              </div>
            </div>
          </Link>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Perlu Perhatian"
          description="Kelas <90%, guru belum input, dan siswa alpa beruntun."
        >
          {q.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat data...</div>
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

        <SectionCard title="Aktivitas Terbaru" description="5 sesi absensi terakhir.">
          {q.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat data...</div>
          ) : aktivitas.length === 0 ? (
            <div className="text-sm text-muted-fg">Belum ada absensi tercatat.</div>
          ) : (
            <div className="space-y-2">
              {aktivitas.map((a) => (
                <div key={a.name} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-8 w-8 flex items-center justify-center rounded-md bg-muted text-muted-fg shrink-0">
                      <IconCalendar />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-fg truncate">
                        {a.kelas ?? a.rombel ?? "—"}
                      </div>
                      <div className="text-xs text-muted-fg truncate">
                        {a.name} · {a.total_hadir ?? 0} hadir
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs tabular-nums text-muted-fg">{a.tanggal}</span>
                    <Badge tone={a.status === "Final" ? "success" : "warning"} dot>
                      {a.status ?? "—"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/absensi/")({ component: AbsensiDashboardPage });
