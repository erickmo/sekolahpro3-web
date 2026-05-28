import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  PageHeader,
  SectionCard,
  StatCard,
  IconCheck,
  IconAlert,
} from "@sekolahpro/ui";

type Status = "hadir" | "izin" | "sakit" | "alpa";

type Row = {
  tanggal: string;
  status: Status;
  subject: string;
  teacher: string;
  note?: string;
};

const ROWS: Row[] = [
  { tanggal: "2026-05-23", status: "hadir", subject: "Matematika", teacher: "Bu Siti" },
  { tanggal: "2026-05-23", status: "hadir", subject: "Fisika", teacher: "Pak Andi" },
  { tanggal: "2026-05-22", status: "izin", subject: "Sejarah", teacher: "Bu Rina", note: "Acara keluarga" },
  { tanggal: "2026-05-22", status: "hadir", subject: "Kimia", teacher: "Bu Lina" },
  { tanggal: "2026-05-21", status: "hadir", subject: "Bahasa Inggris", teacher: "Pak Joko" },
  { tanggal: "2026-05-21", status: "hadir", subject: "Biologi", teacher: "Bu Tika" },
  { tanggal: "2026-05-20", status: "sakit", subject: "PJOK", teacher: "Pak Eko", note: "Surat dokter" },
  { tanggal: "2026-05-19", status: "hadir", subject: "Matematika", teacher: "Bu Siti" },
  { tanggal: "2026-05-19", status: "hadir", subject: "Ekonomi", teacher: "Pak Yusuf" },
  { tanggal: "2026-05-16", status: "hadir", subject: "PKn", teacher: "Pak Hadi" },
];

const STATUS_TONE: Record<Status, "success" | "warning" | "neutral" | "danger"> = {
  hadir: "success",
  izin: "warning",
  sakit: "neutral",
  alpa: "danger",
};

const STATUS_LABEL: Record<Status, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

function summarize() {
  let hadir = 0,
    izin = 0,
    sakit = 0,
    alpa = 0;
  for (const r of ROWS) {
    if (r.status === "hadir") hadir++;
    else if (r.status === "izin") izin++;
    else if (r.status === "sakit") sakit++;
    else alpa++;
  }
  const total = ROWS.length;
  const persen = total === 0 ? 0 : Math.round((hadir / total) * 100);
  return { hadir, izin, sakit, alpa, total, persen };
}

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function AbsensiPage() {
  const s = summarize();
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Akademik"
        title="Rekap Absensi"
        description="Riwayat kehadiran kamu di seluruh mata pelajaran."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Persentase Hadir"
          value={`${s.persen}%`}
          accent="emerald"
          icon={<IconCheck />}
          hint={`${s.hadir} dari ${s.total} sesi`}
        />
        <StatCard
          label="Hadir"
          value={s.hadir}
          accent="emerald"
          icon={<IconCheck />}
        />
        <StatCard
          label="Izin / Sakit"
          value={s.izin + s.sakit}
          accent="amber"
          icon={<IconAlert />}
          hint={`Izin ${s.izin} · Sakit ${s.sakit}`}
        />
        <StatCard
          label="Alpa"
          value={s.alpa}
          accent="rose"
          urgency={s.alpa > 0 ? "warn" : "normal"}
          icon={<IconAlert />}
        />
      </div>

      <SectionCard
        title="Riwayat Kehadiran"
        description="10 sesi terakhir"
        padded={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-fg">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Tanggal</th>
                <th className="px-5 py-2.5 text-left font-medium">Mata Pelajaran</th>
                <th className="px-5 py-2.5 text-left font-medium">Guru</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-left font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map((r, i) => (
                <tr key={`${r.tanggal}-${r.subject}-${i}`}>
                  <td className="px-5 py-3 whitespace-nowrap text-muted-fg tabular-nums">
                    {formatTanggal(r.tanggal)}
                  </td>
                  <td className="px-5 py-3 font-medium text-fg">{r.subject}</td>
                  <td className="px-5 py-3 text-muted-fg">{r.teacher}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[r.status]} dot>
                      {STATUS_LABEL[r.status]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-fg text-xs">
                    {r.note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/absensi")({ component: AbsensiPage });
