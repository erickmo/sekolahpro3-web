import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  AttentionList,
  type AttentionItem,
  Avatar,
  Badge,
  Button,
  DashboardTemplate,
  OnboardingChecklist,
  PageHeader,
  SectionCard,
  StatCard,
  IconBook,
  IconCheck,
  IconUsers,
  IconWallet,
} from "@sekolahpro/ui";
import { useOnboardingSteps } from "../data/onboarding";

const ONBOARDING_DISMISS_KEY = "sekolahpro:onboarding-dismissed";

type DayMode = "pagi" | "siang" | "sore" | "luar-jam";

function getDayMode(now: Date = new Date()): DayMode {
  const h = now.getHours();
  if (h >= 6 && h < 10) return "pagi";
  if (h >= 10 && h < 14) return "siang";
  if (h >= 14 && h < 18) return "sore";
  return "luar-jam";
}

const MODE_LABEL: Record<DayMode, string> = {
  pagi: "Mode Pagi",
  siang: "Mode Siang",
  sore: "Mode Sore",
  "luar-jam": "Di Luar Jam Operasional",
};

const MODE_GREETING: Record<DayMode, string> = {
  pagi: "Selamat pagi — fokus hari ini: absensi & agenda.",
  siang: "Selamat siang — fokus hari ini: pembayaran & layanan wali.",
  sore: "Selamat sore — fokus hari ini: tutup kas & rekap harian.",
  "luar-jam": "Di luar jam operasional — ringkasan terakhir.",
};

const MODE_BADGE_TONE: Record<DayMode, "brand" | "warning" | "success" | "neutral"> = {
  pagi: "brand",
  siang: "warning",
  sore: "success",
  "luar-jam": "neutral",
};

type FocusItem = {
  label: string;
  href: "/$sekolah/absensi/guru" | "/$sekolah/absensi/pelajaran" | "/$sekolah/jadwal/daftar" | "/$sekolah/jadwal/slot" | "/$sekolah/keuangan" | "/$sekolah/pesan" | "/$sekolah/siswa/daftar" | "/$sekolah/ppdb/pembayaran" | "/$sekolah/koperasi/kas-teller" | "/$sekolah/laporan";
  meta: string;
};

const FOCUS_BY_MODE: Record<DayMode, readonly FocusItem[]> = {
  pagi: [
    { label: "Cek guru belum input absensi", href: "/$sekolah/absensi/guru", meta: "2 guru" },
    { label: "Tinjau izin siswa masuk", href: "/$sekolah/absensi/pelajaran", meta: "5 izin" },
    { label: "Konfirmasi agenda hari ini", href: "/$sekolah/jadwal/daftar", meta: "12 sesi" },
    { label: "Cari guru pengganti (izin)", href: "/$sekolah/jadwal/slot", meta: "2 kelas" },
  ],
  siang: [
    { label: "Proses pembayaran SPP", href: "/$sekolah/keuangan", meta: "8 transaksi" },
    { label: "Layani permintaan wali", href: "/$sekolah/pesan", meta: "3 pesan baru" },
    { label: "Follow-up berkas siswa", href: "/$sekolah/siswa/daftar", meta: "12 belum lengkap" },
    { label: "Verifikasi pembayaran PPDB", href: "/$sekolah/ppdb/pembayaran", meta: "4 pending" },
  ],
  sore: [
    { label: "Tutup kas teller", href: "/$sekolah/koperasi/kas-teller", meta: "1 belum closing" },
    { label: "Finalisasi absensi harian", href: "/$sekolah/absensi/pelajaran", meta: "3 kelas" },
    { label: "Rekap pengeluaran", href: "/$sekolah/keuangan", meta: "" },
    { label: "Generate laporan harian", href: "/$sekolah/laporan", meta: "" },
  ],
  "luar-jam": [
    { label: "Lihat ringkasan kemarin", href: "/$sekolah/laporan", meta: "" },
    { label: "Persiapan agenda besok", href: "/$sekolah/jadwal/daftar", meta: "" },
  ],
};

const stats = [
  {
    label: "Total Siswa",
    value: "1.248",
    delta: { value: "+24 bulan ini", trend: "up" as const },
    icon: <IconUsers />,
    accent: "brand" as const,
  },
  {
    label: "Kehadiran Hari Ini",
    value: "96,4%",
    delta: { value: "+1,2%", trend: "up" as const },
    icon: <IconCheck />,
    accent: "emerald" as const,
  },
  {
    label: "Tagihan Tertunda",
    value: "Rp 42,7jt",
    delta: { value: "−8%", trend: "down" as const },
    icon: <IconWallet />,
    accent: "amber" as const,
  },
  {
    label: "Kelas Aktif",
    value: "36",
    hint: "12 jurusan",
    icon: <IconBook />,
    accent: "violet" as const,
  },
];

const activities = [
  { who: "Budi Santoso", what: "menyetor SPP September", when: "5 menit lalu", tone: "success" as const },
  { who: "Rina Anggraini", what: "mengajukan izin sakit", when: "32 menit lalu", tone: "warning" as const },
  { who: "Kelas 10-IPA-2", what: "ujian harian Matematika selesai", when: "1 jam lalu", tone: "brand" as const },
  { who: "Admin", what: "menambahkan 12 siswa baru", when: "2 jam lalu", tone: "neutral" as const },
];

// cross-menu signal — wire to backend aggregate when ready
const riskRollup: (AttentionItem & {
  actionHref: "/$sekolah/guru/sk-mengajar" | "/$sekolah/jadwal/slot" | "/$sekolah/keuangan" | "/$sekolah/kelas/rombel";
  metaText: string;
})[] = [
  {
    id: "sk-habis",
    label: "SK guru/staff akan habis dalam 30 hari",
    tone: "warning",
    badge: "SK",
    actionLabel: "Lihat Daftar SK",
    actionHref: "/$sekolah/guru/sk-mengajar",
    metaText: "6 SK",
  },
  {
    id: "guru-absen",
    label: "Guru tidak hadir hari ini",
    tone: "warning",
    badge: "Absensi",
    actionLabel: "Cari Pengganti",
    actionHref: "/$sekolah/jadwal/slot",
    metaText: "2 guru",
  },
  {
    id: "spp-nunggak",
    label: "Siswa nunggak SPP >30 hari",
    tone: "danger",
    badge: "SPP",
    actionLabel: "Tinjau Tagihan",
    actionHref: "/$sekolah/keuangan",
    metaText: "18 siswa · Rp 24,5 jt",
  },
  {
    id: "rombel-tanpa-wali",
    label: "Rombel tanpa wali kelas",
    tone: "danger",
    badge: "Wali",
    actionLabel: "Tunjuk Wali",
    actionHref: "/$sekolah/kelas/rombel",
    metaText: "3 rombel",
  },
];

const agenda = [
  { time: "08:00", title: "Rapat wali kelas", room: "Aula Utama" },
  { time: "10:30", title: "Ujian Matematika 11-IPA", room: "R. 204" },
  { time: "13:00", title: "Pembinaan OSIS", room: "R. OSIS" },
  { time: "15:30", title: "Ekstrakurikuler Pramuka", room: "Lapangan" },
];

function AttendanceChart() {
  const data = [88, 92, 95, 91, 96, 97, 96];
  const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex items-end h-32">
            <div
              className="w-full rounded-md bg-gradient-to-t from-brand to-violet-500"
              style={{ height: `${v}%` }}
              title={`${v}%`}
            />
          </div>
          <span className="text-[11px] text-muted-fg">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function Home() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(ONBOARDING_DISMISS_KEY) === "1",
  );
  const [mode] = useState<DayMode>(() => getDayMode());
  const onboardingSteps = useOnboardingSteps();

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_DISMISS_KEY, "1");
    }
  };

  return (
    <DashboardTemplate
      header={
        <div className="space-y-6">
          {!dismissed ? (
            <OnboardingChecklist
              steps={onboardingSteps}
              onDismiss={handleDismiss}
              renderLink={(href, children) => (
                <Link to={href} params={{ sekolah }} className="block">
                  {children}
                </Link>
              )}
            />
          ) : null}
          <PageHeader
          eyebrow="Beranda"
          title="Selamat datang kembali"
          description={MODE_GREETING[mode]}
          actions={
            <>
              <Badge tone={MODE_BADGE_TONE[mode]} dot>{MODE_LABEL[mode]}</Badge>
              <Button variant="outline">Ekspor</Button>
              <Button>+ Pengumuman</Button>
            </>
          }
        />
        </div>
      }
      stats={stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
      primary={
        <>
          <SectionCard title={MODE_LABEL[mode]} description={MODE_GREETING[mode]}>
            <ul role="list" className="divide-y divide-border">
              {FOCUS_BY_MODE[mode].map((item) => (
                <li key={item.label} className="py-2.5">
                  <Link to={item.href} params={{ sekolah }} className="flex items-center justify-between gap-3 group">
                    <span className="text-sm text-fg group-hover:text-brand transition-colors">{item.label}</span>
                    <span className="text-xs text-muted-fg">{item.meta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Roll-up Risiko Operasional"
            description="Sinyal lintas modul yang perlu tindakan."
          >
            <AttentionList
              items={riskRollup.map((r): AttentionItem => ({
                id: r.id,
                label: r.label,
                ...(r.tone ? { tone: r.tone } : {}),
                ...(r.badge ? { badge: r.badge } : {}),
                ...(r.actionLabel ? { actionLabel: r.actionLabel } : {}),
                actionHref: r.actionHref,
                meta: <span className="tabular-nums">{r.metaText}</span>,
              }))}
              renderLink={(href, children) => (
                // riskRollup.actionHref is typed to known routes — safe to cast.
                <Link to={href as "/$sekolah/guru/sk-mengajar"} params={{ sekolah }}>{children}</Link>
              )}
            />
          </SectionCard>

          <SectionCard
            title="Tren Kehadiran"
            description="7 hari terakhir"
            action={<Badge tone="brand" dot>96,4% rata-rata</Badge>}
          >
            <AttendanceChart />
          </SectionCard>

          <SectionCard
            title="Aktivitas Terbaru"
            action={<Button variant="ghost" size="sm">Lihat semua</Button>}
            padded={false}
          >
            <ul className="divide-y divide-border">
              {activities.map((a, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={a.who} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <span className="font-medium text-fg">{a.who}</span>{" "}
                      <span className="text-muted-fg">{a.what}</span>
                    </div>
                    <div className="text-xs text-muted-fg mt-0.5">{a.when}</div>
                  </div>
                  <Badge tone={a.tone} dot>·</Badge>
                </li>
              ))}
            </ul>
          </SectionCard>
        </>
      }
      side={
        <>
          <SectionCard title="Agenda Hari Ini" padded={false}>
            <ul className="divide-y divide-border">
              {agenda.map((a, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3">
                  <span className="text-xs font-semibold text-brand w-12 tabular-nums pt-0.5">
                    {a.time}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-fg truncate">{a.title}</div>
                    <div className="text-xs text-muted-fg">{a.room}</div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Aksi Cepat">
            <div className="grid grid-cols-2 gap-2">
              {([
                { label: "Tambah Siswa", to: "/$sekolah/siswa/new" },
                { label: "Catat Pembayaran", to: "/$sekolah/keuangan" },
                { label: "Buat Pengumuman", to: "/$sekolah/pesan" },
                { label: "Cetak Rapor", to: "/$sekolah/akademik/raport" },
              ] as const).map((q) => (
                <Link
                  key={q.label}
                  to={q.to}
                  params={{ sekolah }}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-border bg-transparent hover:bg-muted h-auto py-3 px-3"
                >
                  <span className="text-xs font-medium">{q.label}</span>
                </Link>
              ))}
            </div>
          </SectionCard>
        </>
      }
    />
  );
}

export const Route = createFileRoute("/$sekolah/")({ component: Home });
