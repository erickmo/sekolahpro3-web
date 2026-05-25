import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DashboardTemplate,
  PageHeader,
  SectionCard,
  StatCard,
  IconBook,
  IconCalendar,
  IconChart,
  IconCheck,
} from "@sekolahpro/ui";

const stats = [
  {
    label: "Rata-rata Nilai",
    value: "87,5",
    delta: { value: "+3,2", trend: "up" as const },
    icon: <IconChart />,
    accent: "brand" as const,
  },
  {
    label: "Kehadiran",
    value: "98%",
    delta: { value: "+1%", trend: "up" as const },
    icon: <IconCheck />,
    accent: "emerald" as const,
  },
  {
    label: "Tugas Pending",
    value: "3",
    hint: "1 jatuh tempo besok",
    icon: <IconBook />,
    accent: "amber" as const,
  },
  {
    label: "Ujian Mendatang",
    value: "2",
    hint: "minggu ini",
    icon: <IconCalendar />,
    accent: "violet" as const,
  },
];

const schedule = [
  { time: "07:30", subject: "Matematika", teacher: "Bu Siti", room: "R. 204" },
  { time: "09:00", subject: "Bahasa Inggris", teacher: "Pak Joko", room: "R. 101" },
  { time: "10:30", subject: "Fisika", teacher: "Pak Andi", room: "Lab Fisika" },
  { time: "13:00", subject: "Sejarah", teacher: "Bu Rina", room: "R. 305" },
];

const grades = [
  { subject: "Matematika", score: 92, grade: "A" },
  { subject: "Bahasa Indonesia", score: 88, grade: "A" },
  { subject: "Fisika", score: 85, grade: "B+" },
  { subject: "Kimia", score: 79, grade: "B" },
  { subject: "Bahasa Inggris", score: 90, grade: "A" },
];

const tasks = [
  { title: "Esai Sejarah: Kemerdekaan", due: "Besok", tone: "danger" as const },
  { title: "PR Matematika Bab 5", due: "2 hari lagi", tone: "warning" as const },
  { title: "Laporan Praktikum Fisika", due: "5 hari lagi", tone: "neutral" as const },
];

function Hero() {
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
            Hari ini
          </div>
          <h2 className="mt-2 text-2xl lg:text-3xl font-bold leading-tight">
            Halo! Kamu punya 4 pelajaran dan 1 tugas yang jatuh tempo besok.
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Tetap semangat dan jangan lupa kumpulkan esai Sejarah ya.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            Lihat Jadwal
          </Button>
          <Button className="bg-white text-fg hover:bg-white/90">
            Buka Tugas
          </Button>
        </div>
      </div>
    </div>
  );
}

function Home() {
  return (
    <DashboardTemplate
      header={
        <PageHeader
          eyebrow="Beranda"
          title="Dashboard Siswa"
          description="Ringkasan belajar kamu — Senin, 24 Mei 2026."
        />
      }
      stats={stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
      primary={
        <>
          <Hero />
          <SectionCard
            title="Jadwal Hari Ini"
            description="Senin · 4 mata pelajaran"
            padded={false}
          >
            <ul className="divide-y divide-border">
              {schedule.map((s, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-3.5">
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
            action={<Button variant="ghost" size="sm">Lihat semua</Button>}
          >
            <ul className="space-y-3">
              {grades.map((g) => (
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
          <SectionCard title="Tugas Mendatang" padded={false}>
            <ul className="divide-y divide-border">
              {tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3">
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

          <SectionCard title="Progres Semester">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-fg">Minggu 12 dari 18</span>
              <span className="font-semibold text-fg">67%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                style={{ width: "67%" }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-fg">
              Ujian tengah semester selesai · 6 minggu menuju UAS
            </p>
          </SectionCard>
        </>
      }
    />
  );
}

export const Route = createFileRoute("/")({ component: Home });
