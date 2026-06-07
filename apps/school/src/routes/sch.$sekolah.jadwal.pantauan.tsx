import { useMemo } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  PageHeader,
  SectionCard,
  StatCard,
  IconAlert,
  IconUsers,
  IconBook,
} from "@sekolahpro/ui";
import { useFrappeMethod, useResourceList } from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

const JTM_MINIMAL = 24;
const METHOD_CAKUPAN = "sekolahpro.akademik.api.jadwal.cakupan_jadwal";
const METHOD_BEBAN = "sekolahpro.akademik.api.jadwal.beban_mengajar_guru";

interface CakupanRow {
  rombel: string;
  total_slot: number;
  tanpa_guru: number;
}
interface BebanRow {
  guru: string;
  total_menit: number;
  jtm: number;
}
interface JadwalDiajukanRow {
  name: string;
  rombel?: string;
}

function PantauanPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const cakupanQ = useFrappeMethod<CakupanRow[]>(METHOD_CAKUPAN, { sekolah });
  const bebanQ = useFrappeMethod<BebanRow[]>(METHOD_BEBAN, { sekolah });
  const antreanQ = useResourceList<JadwalDiajukanRow>("Jadwal Pelajaran", {
    fields: ["name", "rombel"],
    filters: { workflow_state: "Diajukan" },
    limit_page_length: 0,
  });

  const cakupan = useMemo(() => cakupanQ.data ?? [], [cakupanQ.data]);
  const beban = useMemo(() => bebanQ.data ?? [], [bebanQ.data]);
  const antrean = antreanQ.data ?? [];

  const lubang = cakupan.reduce((n, r) => n + Number(r.tanpa_guru || 0), 0);
  const guruKurangJtm = beban.filter((b) => b.jtm < JTM_MINIMAL);

  const semuaTercover = !cakupanQ.isLoading && lubang === 0;
  const bebanSeimbang = !bebanQ.isLoading && guruKurangJtm.length === 0;
  const tanpaAntrean = !antreanQ.isLoading && antrean.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jadwal"
        title="Pantauan Jadwal"
        description="Tinjauan kesehatan jadwal: cakupan kelas, beban mengajar, dan antrean persetujuan."
      />

      <PageGuide
        storageNamespace="jadwal-guide:"
        storageId="pantauan"
        title="Cara pakai Pantauan"
        intro="Hari sehat = tiga kartu hijau. Telusuri hanya bila ada yang merah."
        steps={[
          { title: "Cakupan kelas", detail: "Jumlah slot tanpa guru — idealnya nol.", roles: ["kepala_sekolah"] },
          { title: "Beban guru", detail: "Guru di bawah 24 JTM perlu perhatian sertifikasi.", roles: ["kepala_sekolah"] },
          { title: "Antrean persetujuan", detail: "Jadwal menunggu disetujui — buka menu Persetujuan.", roles: ["kepala_sekolah"] },
        ]}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Lubang Jadwal"
          value={cakupanQ.isLoading ? "…" : lubang}
          hint="slot tanpa guru"
          icon={<IconBook />}
          accent={semuaTercover ? "emerald" : "rose"}
          urgency={semuaTercover ? "normal" : "critical"}
        />
        <StatCard
          label="Guru < 24 JTM"
          value={bebanQ.isLoading ? "…" : guruKurangJtm.length}
          hint="di bawah ambang sertifikasi"
          icon={<IconUsers />}
          accent={bebanSeimbang ? "emerald" : "amber"}
          urgency={bebanSeimbang ? "normal" : "warn"}
        />
        <StatCard
          label="Menunggu Persetujuan"
          value={antreanQ.isLoading ? "…" : antrean.length}
          hint="jadwal diajukan"
          icon={<IconAlert />}
          accent={tanpaAntrean ? "emerald" : "brand"}
          urgency={tanpaAntrean ? "normal" : "warn"}
          actionHref="/sch/$sekolah/jadwal/persetujuan"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Cakupan per Rombel" description="Rombel dengan lubang jadwal didahulukan." padded={false}>
          {cakupanQ.isLoading ? (
            <div className="px-5 py-6 text-sm text-muted-fg">Memuat…</div>
          ) : cakupan.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-fg">Belum ada jadwal aktif.</div>
          ) : (
            <ul className="divide-y divide-border">
              {cakupan.map((r) => (
                <li key={r.rombel} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1 text-sm font-medium text-fg truncate">{r.rombel}</span>
                  <span className="text-xs text-muted-fg tabular-nums">{r.total_slot} slot</span>
                  {Number(r.tanpa_guru) > 0 ? (
                    <Badge tone="danger">{r.tanpa_guru} tanpa guru</Badge>
                  ) : (
                    <Badge tone="success">lengkap</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Beban Mengajar (JTM)" description="Guru di bawah 24 JTM ditandai." padded={false}>
          {bebanQ.isLoading ? (
            <div className="px-5 py-6 text-sm text-muted-fg">Memuat…</div>
          ) : beban.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-fg">Belum ada beban mengajar.</div>
          ) : (
            <ul className="divide-y divide-border">
              {beban.map((b) => (
                <li key={b.guru} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1 text-sm font-medium text-fg truncate">{b.guru}</span>
                  <span className="text-xs text-muted-fg tabular-nums">{b.jtm} JTM</span>
                  {b.jtm < JTM_MINIMAL && <Badge tone="warning">kurang</Badge>}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal/pantauan")({ component: PantauanPage });
