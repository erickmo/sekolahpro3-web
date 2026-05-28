import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  PageHeader,
  SectionCard,
  StatCard,
  Tabs,
  type TabItem,
  IconChart,
  IconBook,
  IconCheck,
} from "@sekolahpro/ui";

type Komponen = {
  label: string;
  bobot: number;
  nilai: number;
};

type Mapel = {
  kode: string;
  nama: string;
  guru: string;
  kkm: number;
  komponen: Komponen[];
};

const SEMESTER = ["Ganjil 2026/2027", "Genap 2025/2026", "Ganjil 2025/2026"] as const;
type Semester = (typeof SEMESTER)[number];

const DATA: Record<Semester, Mapel[]> = {
  "Ganjil 2026/2027": [
    {
      kode: "MTK",
      nama: "Matematika",
      guru: "Bu Siti",
      kkm: 75,
      komponen: [
        { label: "Tugas", bobot: 30, nilai: 90 },
        { label: "UTS", bobot: 30, nilai: 92 },
        { label: "UAS", bobot: 40, nilai: 94 },
      ],
    },
    {
      kode: "BIN",
      nama: "Bahasa Indonesia",
      guru: "Pak Bambang",
      kkm: 75,
      komponen: [
        { label: "Tugas", bobot: 30, nilai: 85 },
        { label: "UTS", bobot: 30, nilai: 88 },
        { label: "UAS", bobot: 40, nilai: 90 },
      ],
    },
    {
      kode: "FIS",
      nama: "Fisika",
      guru: "Pak Andi",
      kkm: 70,
      komponen: [
        { label: "Praktikum", bobot: 30, nilai: 88 },
        { label: "UTS", bobot: 30, nilai: 82 },
        { label: "UAS", bobot: 40, nilai: 85 },
      ],
    },
    {
      kode: "KIM",
      nama: "Kimia",
      guru: "Bu Lina",
      kkm: 70,
      komponen: [
        { label: "Praktikum", bobot: 30, nilai: 78 },
        { label: "UTS", bobot: 30, nilai: 80 },
        { label: "UAS", bobot: 40, nilai: 79 },
      ],
    },
    {
      kode: "BIG",
      nama: "Bahasa Inggris",
      guru: "Pak Joko",
      kkm: 75,
      komponen: [
        { label: "Tugas", bobot: 30, nilai: 92 },
        { label: "UTS", bobot: 30, nilai: 89 },
        { label: "UAS", bobot: 40, nilai: 90 },
      ],
    },
    {
      kode: "SEJ",
      nama: "Sejarah",
      guru: "Bu Rina",
      kkm: 70,
      komponen: [
        { label: "Tugas", bobot: 40, nilai: 78 },
        { label: "UTS", bobot: 30, nilai: 72 },
        { label: "UAS", bobot: 30, nilai: 75 },
      ],
    },
  ],
  "Genap 2025/2026": [
    {
      kode: "MTK",
      nama: "Matematika",
      guru: "Bu Siti",
      kkm: 75,
      komponen: [
        { label: "Tugas", bobot: 30, nilai: 85 },
        { label: "UTS", bobot: 30, nilai: 84 },
        { label: "UAS", bobot: 40, nilai: 86 },
      ],
    },
    {
      kode: "FIS",
      nama: "Fisika",
      guru: "Pak Andi",
      kkm: 70,
      komponen: [
        { label: "Praktikum", bobot: 30, nilai: 82 },
        { label: "UTS", bobot: 30, nilai: 80 },
        { label: "UAS", bobot: 40, nilai: 84 },
      ],
    },
  ],
  "Ganjil 2025/2026": [
    {
      kode: "MTK",
      nama: "Matematika",
      guru: "Bu Siti",
      kkm: 75,
      komponen: [
        { label: "Tugas", bobot: 30, nilai: 80 },
        { label: "UTS", bobot: 30, nilai: 78 },
        { label: "UAS", bobot: 40, nilai: 82 },
      ],
    },
  ],
};

function nilaiAkhir(m: Mapel): number {
  const totalBobot = m.komponen.reduce((s, k) => s + k.bobot, 0);
  if (totalBobot === 0) return 0;
  const total = m.komponen.reduce((s, k) => s + k.bobot * k.nilai, 0);
  return Math.round((total / totalBobot) * 10) / 10;
}

function predikat(score: number): { label: string; tone: "success" | "warning" | "danger" } {
  if (score >= 90) return { label: "A", tone: "success" };
  if (score >= 80) return { label: "B", tone: "success" };
  if (score >= 70) return { label: "C", tone: "warning" };
  return { label: "D", tone: "danger" };
}

function MapelCard({ m }: { m: Mapel }) {
  const akhir = nilaiAkhir(m);
  const pred = predikat(akhir);
  const tuntas = akhir >= m.kkm;

  return (
    <div className="rounded-xl border border-border bg-bg p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-fg">
            {m.kode}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-fg truncate">
            {m.nama}
          </div>
          <div className="text-xs text-muted-fg">{m.guru}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-fg">{akhir}</div>
          <Badge tone={pred.tone}>{pred.label}</Badge>
        </div>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${
            tuntas
              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
              : "bg-gradient-to-r from-amber-500 to-rose-500"
          }`}
          style={{ width: `${Math.min(akhir, 100)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-fg">
        <span>KKM {m.kkm}</span>
        <span className={tuntas ? "text-emerald-600" : "text-rose-600"}>
          {tuntas ? "Tuntas" : "Belum tuntas"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {m.komponen.map((k) => (
          <div key={k.label} className="rounded-md bg-muted/40 p-2 text-center">
            <dt className="text-[10px] uppercase tracking-wider text-muted-fg">
              {k.label} · {k.bobot}%
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-fg">
              {k.nilai}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function NilaiPage() {
  const [semester, setSemester] = useState<Semester>(SEMESTER[0]);
  const mapel = DATA[semester] ?? [];

  const stats = useMemo(() => {
    if (mapel.length === 0) {
      return { rata: 0, tuntas: 0, total: 0, tertinggi: { nama: "—", score: 0 } };
    }
    const scores = mapel.map((m) => ({ nama: m.nama, score: nilaiAkhir(m), kkm: m.kkm }));
    const rata = Math.round(
      (scores.reduce((s, m) => s + m.score, 0) / scores.length) * 10,
    ) / 10;
    const tuntas = scores.filter((m) => m.score >= m.kkm).length;
    const tertinggi = scores.reduce((a, b) => (b.score > a.score ? b : a), scores[0]!);
    return { rata, tuntas, total: scores.length, tertinggi };
  }, [mapel]);

  const tabs: TabItem[] = SEMESTER.map((s) => ({
    key: s,
    label: s,
    active: semester === s,
    count: DATA[s]?.length ?? 0,
    render: ({ className, children }) => (
      <button type="button" onClick={() => setSemester(s)} className={className}>
        {children}
      </button>
    ),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Akademik"
        title="Nilai"
        description="Rekap nilai per mata pelajaran beserta komponen pembentuknya."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Rata-rata"
          value={stats.rata}
          accent="brand"
          icon={<IconChart />}
        />
        <StatCard
          label="Mapel Tuntas"
          value={`${stats.tuntas}/${stats.total}`}
          accent="emerald"
          icon={<IconCheck />}
        />
        <StatCard
          label="Total Mapel"
          value={stats.total}
          accent="violet"
          icon={<IconBook />}
        />
        <StatCard
          label="Nilai Tertinggi"
          value={stats.tertinggi.score}
          accent="amber"
          icon={<IconChart />}
          hint={stats.tertinggi.nama}
        />
      </div>

      <Tabs items={tabs} />

      <SectionCard
        title={`Daftar Mata Pelajaran — ${semester}`}
        description={`${mapel.length} mapel`}
      >
        {mapel.length === 0 ? (
          <p className="text-sm text-muted-fg">Belum ada nilai pada semester ini.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mapel.map((m) => (
              <MapelCard key={m.kode} m={m} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/nilai")({ component: NilaiPage });
