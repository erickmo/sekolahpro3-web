import { useMemo } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import {
  PageHeader,
  SectionCard,
  StatCard,
  Badge,
  cn,
  IconFlag,
  IconUsers,
  IconCalendar,
  IconCheck,
} from "@sekolahpro/ui";
import { HBarChart } from "../components/viz/charts";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { useEkskulContext } from "../lib/ekskulContext";
import { useEkskulRole, ROLE_LABEL, type EkskulRole } from "../lib/ekskulRole";
import { programStats, kategoriChart, type ProgramRow } from "../lib/ekskulRecap";

const PROGRAM_FIELDS = ["name", "nama", "status", "kategori", "penyelenggara"];

const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Buat program ekstrakurikuler",
    detail: "Mulai dari menu Program: cukup nama, pembina, jadwal, dan kuota.",
    roles: ["koordinator"],
  },
  {
    title: "Daftarkan peserta",
    detail: "Di menu Pendaftaran, tambahkan siswa ke program. Kuota dijaga otomatis.",
    roles: ["koordinator"],
  },
  {
    title: "Catat kehadiran tiap pertemuan",
    detail: 'Buka "Sesi & Kehadiran" — mulai sesi hari ini satu ketuk, semua peserta default Hadir, tandai yang absen saja.',
    roles: ["pembina"],
  },
  {
    title: "Terbitkan raport akhir semester",
    detail: "Di menu Raport, generate untuk semua peserta — rekap kehadiran terisi otomatis, tinggal pilih predikat.",
    roles: ["pembina", "kepala"],
  },
];

const ROLE_FOCUS: Record<EkskulRole, string> = {
  pembina: "Menjalankan sesi, mencatat kehadiran, dan menilai predikat peserta binaan.",
  koordinator: "Menyiapkan program, mitra, dan pendaftaran agar pembina tinggal menjalankan.",
  kepala: "Memantau cakupan kegiatan dan menyetujui kerja sama dengan mitra.",
};

function RoleFocus({ role, active, text }: { role: EkskulRole; active: boolean; text: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        active ? "border-brand/40 bg-brand/5" : "border-border bg-muted/20",
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <Badge tone={active ? "brand" : "neutral"}>{ROLE_LABEL[role]}</Badge>
      </div>
      <p className="text-xs text-muted-fg">{text}</p>
    </div>
  );
}

function EkskulDashboard() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const ctx = useEkskulContext();
  const { isPembina, isKoordinator, isKepala } = useEkskulRole();

  const taFilter = ctx.tahunAjaran
    ? ([["tahun_ajaran", "=", ctx.tahunAjaran]] as [string, string, string][])
    : [];

  const programQ = useResourceList<ProgramRow & { penyelenggara?: string }>(
    "Ekstrakurikuler",
    { fields: PROGRAM_FIELDS, filters: taFilter, limit_page_length: 0 },
    { enabled: !!ctx.tahunAjaran },
  );
  const programs = useMemo(() => programQ.data ?? [], [programQ.data]);

  const pesertaQ = useResourceList<{ name: string }>(
    "Pendaftaran Ekstrakurikuler",
    {
      fields: ["name"],
      filters: ctx.tahunAjaran
        ? ([
            ["tahun_ajaran", "=", ctx.tahunAjaran],
            ["status", "=", "Aktif"],
          ] as [string, string, string][])
        : [],
      limit_page_length: 0,
    },
    { enabled: !!ctx.tahunAjaran },
  );

  const sesiQ = useResourceList<{ name: string }>(
    "Sesi Ekstrakurikuler",
    {
      fields: ["name"],
      filters: ctx.semester
        ? ([["semester", "=", ctx.semester]] as [string, string, string][])
        : [],
      limit_page_length: 0,
    },
    { enabled: !!ctx.semester },
  );

  const stats = useMemo(() => programStats(programs), [programs]);
  const kategori = useMemo(() => kategoriChart(programs), [programs]);
  const mitraCount = programs.filter((p) => p.penyelenggara === "Mitra").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ekstrakurikuler"
        title="Pusat Kegiatan Ekstrakurikuler"
        description="Kelola program, pendaftaran, kehadiran, dan raport kegiatan dalam satu alur."
      />

      <PageGuide
        storageId="ekskul-dashboard"
        title="Alur ekstrakurikuler"
        intro="Empat langkah: buat program → daftarkan peserta → catat kehadiran → terbitkan raport."
        steps={GUIDE_STEPS}
        roleLabels={ROLE_LABEL}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Program Aktif" value={programQ.isLoading ? "…" : stats.aktif} hint={`${stats.total} program total`} icon={<IconFlag />} accent="brand" />
        <StatCard label="Peserta Aktif" value={pesertaQ.isLoading ? "…" : (pesertaQ.data?.length ?? 0)} hint="Pendaftaran berjalan" icon={<IconUsers />} accent="violet" />
        <StatCard label="Sesi Semester Ini" value={sesiQ.isLoading ? "…" : (sesiQ.data?.length ?? 0)} hint="Pertemuan tercatat" icon={<IconCalendar />} accent="emerald" />
        <StatCard label="Program Mitra" value={programQ.isLoading ? "…" : mitraCount} hint="Dijalankan pihak ketiga" icon={<IconCheck />} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <RoleFocus role="pembina" active={isPembina} text={ROLE_FOCUS.pembina} />
        <RoleFocus role="koordinator" active={isKoordinator} text={ROLE_FOCUS.koordinator} />
        <RoleFocus role="kepala" active={isKepala} text={ROLE_FOCUS.kepala} />
      </div>

      {programs.length > 0 ? (
        <SectionCard title="Program per Kategori" description="Sebaran kegiatan pada tahun ajaran terpilih.">
          <HBarChart data={kategori} valueFormatter={(v) => `${v} program`} />
        </SectionCard>
      ) : (
        <SectionCard title="Belum ada program" description="Mulai dengan membuat program ekstrakurikuler pertama.">
          <Link
            to="/sch/$sekolah/ekstrakurikuler/program"
            params={{ sekolah }}
            className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90"
          >
            Buat Program
          </Link>
        </SectionCard>
      )}

      <SectionCard title="Aksi Cepat">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { to: "/sch/$sekolah/ekstrakurikuler/sesi", label: "Sesi & Kehadiran" },
              { to: "/sch/$sekolah/ekstrakurikuler/program", label: "Program" },
              { to: "/sch/$sekolah/ekstrakurikuler/pendaftaran", label: "Pendaftaran" },
              { to: "/sch/$sekolah/ekstrakurikuler/raport", label: "Raport" },
            ] as const
          ).map((q) => (
            <Link
              key={q.label}
              to={q.to}
              params={{ sekolah }}
              className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-3 py-3 text-xs font-medium hover:bg-muted"
            >
              {q.label}
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ekstrakurikuler/")({
  component: EkskulDashboard,
});
