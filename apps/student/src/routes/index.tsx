import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  DashboardTemplate,
  PageHeader,
  SectionCard,
  StatCard,
  IconBook,
  IconCalendar,
  IconChart,
  IconCheck,
} from "@sekolahpro/ui";
import { useSession } from "@sekolahpro/auth";
import { AdBanner } from "@sekolahpro/ads";
import {
  KELAS_SISWA,
  agendaMendatang,
  jadwalHariIni,
  kehadiranBulanIni,
  nilaiTerbaru,
  progresSemester,
  ringkasanStat,
} from "../data/dashboard";

function formatHariIni(d: Date = new Date()): string {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const stats = [
  {
    label: "Rata-rata Nilai",
    value: ringkasanStat.rataNilai,
    delta: { value: ringkasanStat.deltaNilai, trend: "up" as const },
    icon: <IconChart />,
    accent: "brand" as const,
  },
  {
    label: "Kehadiran",
    value: ringkasanStat.kehadiran,
    delta: { value: ringkasanStat.deltaKehadiran, trend: "up" as const },
    icon: <IconCheck />,
    accent: "emerald" as const,
  },
  {
    label: "Tugas Pending",
    value: String(ringkasanStat.tugasPending),
    hint: ringkasanStat.tugasHint,
    icon: <IconBook />,
    accent: "amber" as const,
  },
  {
    label: "Ujian Mendatang",
    value: String(ringkasanStat.ujianMendatang),
    hint: ringkasanStat.ujianHint,
    icon: <IconCalendar />,
    accent: "violet" as const,
  },
];

function Hero({ name, hariIni }: { name: string; hariIni: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, hsl(222 89% 55%) 0%, hsl(262 83% 58%) 60%, hsl(292 76% 50%) 100%)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 90% 10%, rgba(255,255,255,0.4) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/80">
            {hariIni}
          </div>
          <h2 className="mt-2 text-2xl lg:text-3xl font-bold leading-tight">
            Halo, {name}! Kamu punya {jadwalHariIni.length} pelajaran dan 1 tugas jatuh tempo besok.
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Kelas {KELAS_SISWA} · Semangat ya, jangan lupa kumpulkan esai Sejarah.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/jadwal"
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/30 bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20"
          >
            Lihat Jadwal
          </Link>
          <Link
            to="/nilai"
            className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-fg hover:bg-white/90"
          >
            Lihat Nilai
          </Link>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const session = useSession();
  const name = session.user ?? "Siswa";
  const hariIni = formatHariIni();
  return (
    <DashboardTemplate
      header={
        <PageHeader
          eyebrow="Beranda"
          title={`Dashboard ${name}`}
          description={`Ringkasan belajarmu — ${hariIni}.`}
        />
      }
      stats={stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
      primary={
        <>
          <AdBanner slot="student-dashboard-top" className="mb-4 w-full" />
          <Hero name={name} hariIni={hariIni} />
          <SectionCard
            title="Jadwal Hari Ini"
            description={`Senin · ${jadwalHariIni.length} mata pelajaran`}
            action={
              <Link
                to="/jadwal"
                className="text-xs font-medium text-brand hover:underline"
              >
                Mingguan →
              </Link>
            }
            padded={false}
          >
            <ul className="divide-y divide-border">
              {jadwalHariIni.map((s) => (
                <li key={s.time} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-14 text-center">
                    <div className="text-sm font-semibold text-brand tabular-nums">
                      {s.time}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg truncate">
                      {s.subject}
                    </div>
                    <div className="text-xs text-muted-fg">
                      {s.teacher} · {s.room}
                    </div>
                  </div>
                  <Badge tone="neutral">{s.room}</Badge>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Nilai Terbaru"
            action={
              <Link
                to="/nilai"
                className="text-xs font-medium text-brand hover:underline"
              >
                Semua nilai →
              </Link>
            }
          >
            <ul className="space-y-3">
              {nilaiTerbaru.map((g) => (
                <li key={g.subject}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-fg">{g.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-fg">
                        {g.score}
                      </span>
                      <Badge tone={g.score >= 85 ? "success" : "warning"}>
                        {g.grade}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-violet-500"
                      style={{ width: `${g.score}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </>
      }
      side={
        <>
          <SectionCard title="Agenda Mendatang" padded={false}>
            <ul className="divide-y divide-border">
              {agendaMendatang.map((t) => (
                <li key={t.title} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-fg">{t.title}</div>
                    <div className="text-xs text-muted-fg mt-0.5">
                      Jatuh tempo: {t.due}
                    </div>
                  </div>
                  <Badge tone={t.tone}>{t.due}</Badge>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Kehadiran Bulan Ini">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Hadir", value: kehadiranBulanIni.hadir, tone: "text-emerald-600" },
                { label: "Izin", value: kehadiranBulanIni.izin, tone: "text-amber-600" },
                { label: "Alpa", value: kehadiranBulanIni.alpa, tone: "text-rose-600" },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border border-border p-3">
                  <div className={`text-xl font-semibold tabular-nums ${c.tone}`}>
                    {c.value}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-fg mt-1">
                    {c.label}
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/absensi"
              className="mt-3 inline-block text-xs font-medium text-brand hover:underline"
            >
              Riwayat lengkap →
            </Link>
          </SectionCard>

          <SectionCard title="Progres Semester">
            {(() => {
              const pct = Math.round(
                (progresSemester.mingguBerjalan / progresSemester.totalMinggu) * 100,
              );
              return (
                <>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-fg">
                      Minggu {progresSemester.mingguBerjalan} dari {progresSemester.totalMinggu}
                    </span>
                    <span className="font-semibold text-fg">{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-muted-fg">{progresSemester.catatan}</p>
                </>
              );
            })()}
          </SectionCard>
        </>
      }
    />
  );
}

export const Route = createFileRoute("/")({ component: Home });
