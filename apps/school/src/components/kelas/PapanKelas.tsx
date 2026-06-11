/**
 * Papan Kelas — the Tata Usaha structure-builder board (default /kelas surface).
 *
 * One TA-scoped control board: a tahun-ajaran selector, a DefectGate, and the
 * three fix-it trays the TU drains to zero (Tanpa Wali / Over-Penuh / Belum
 * Berkelas). Defect aggregation is delegated to the tested {@link computeDefects}
 * / {@link totalDefects} helpers; TA resolution reuses {@link resolveTahunAjaran}.
 *
 * v1 scope: counts are client-side over the rombel list (audit fast-follow:
 * server Query Report). The orphan tray ("Belum Berkelas") and the generate /
 * place-orphan / rollover mutations need the BE controller methods + endpoint
 * (siswa_belum_berkelas) and land in the BE phase — shown here as pending so the
 * board never silently claims completeness it cannot verify.
 */
import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  PageHeader,
  SectionCard,
  GlossaryTooltip,
  Button,
  IconBook,
  IconUsers,
  IconCheck,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../../lib/glossary";
import { PageGuide } from "../guide";
import { KELAS_PAGE_GUIDES } from "./pageGuides";
import { SCHOOL_ROLE_LABEL } from "../../lib/schoolGuideRole";
import { type TahunAjaranRow } from "../../lib/akademikPeriode";
import { useKelasPeriode, useKelasReadOnly } from "../../lib/kelasPeriode";
import { computeDefects, totalDefects, type BoardRombelRow } from "../../lib/kelasBoard";
import { DefectGate } from "./DefectGate";
import { FixItTray } from "./FixItTray";
import { RolloverDrawer } from "./RolloverDrawer";
import { OrphanTray } from "./OrphanTray";
import { GeneratorModal } from "./GeneratorModal";
import { BumpModal } from "./BumpModal";

const QUICK_LINKS = [
  { to: "/sch/$sekolah/akademik/$ta/kelas/daftar", label: "Daftar Kelas", icon: <IconBook /> },
  { to: "/sch/$sekolah/akademik/$ta/kelas/rombel", label: "Rombongan Belajar", icon: <IconUsers /> },
  { to: "/sch/$sekolah/akademik/$ta/kelas/anggota", label: "Anggota Rombel", icon: <IconCheck /> },
] as const;

export function PapanKelas() {
  // `taParam` is the URL segment (encoded) for intra-module Links; the TA *value*
  // used to scope data comes from the period context below (`ta`).
  const { sekolah, ta: taParam } = useParams({ from: "/sch/$sekolah/akademik/$ta/kelas" });
  const qc = useQueryClient();

  const taQuery = useResourceList<TahunAjaranRow>("Tahun Ajaran", {
    fields: ["name", "nama", "is_current", "status", "tanggal_mulai", "tanggal_selesai"],
    limit_page_length: 0,
  });
  const taList = taQuery.data ?? [];

  const [rolloverOpen, setRolloverOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [bumpRombel, setBumpRombel] = useState<string | null>(null);
  const refetchBoard = () =>
    qc.invalidateQueries({ queryKey: ["resource:list", "Rombongan Belajar"] });
  // TA now comes from the module's KelasPeriodContext (the strip selector), not
  // a local dropdown; the board stays client-side filtered by it. Structure
  // mutations are gated when an archived year is selected.
  const { tahunAjaran: ta } = useKelasPeriode();
  const { readOnly, reason } = useKelasReadOnly();

  const rombelQuery = useResourceList<BoardRombelRow>("Rombongan Belajar", {
    fields: [
      "name",
      "nama_rombel",
      "tingkat",
      "jumlah_siswa",
      "wali_kelas",
      "kapasitas",
      "status",
      "tahun_ajaran",
    ],
    limit_page_length: 0,
  });

  const rows = useMemo(
    () => (rombelQuery.data ?? []).filter((r) => !ta || r.tahun_ajaran === ta),
    [rombelQuery.data, ta],
  );
  const defects = useMemo(() => computeDefects(rows), [rows]);
  // Orphan count is BE-backed (siswa_belum_berkelas) — pending; counted as 0 in v1.
  const defectCount = totalDefects(defects, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik"
        title="Papan Kelas"
        description={
          <>
            Bereskan <GlossaryTooltip term="Rombel" definition={GLOSSARY.Rombel} /> per tahun
            ajaran: wali, kapasitas, dan siswa belum berkelas.
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGeneratorOpen(true)}
              disabled={readOnly}
              {...(reason ? { title: reason } : {})}
            >
              Buat Rombel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRolloverOpen(true)}
              disabled={readOnly}
              {...(reason ? { title: reason } : {})}
            >
              Naik Kelas
            </Button>
          </div>
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

      <DefectGate defectCount={defectCount} />

      <div className="grid gap-4 lg:grid-cols-3">
        <FixItTray
          title="Tanpa Wali"
          tone="danger"
          description="Rombel belum punya wali kelas."
          items={defects.tanpaWali}
          emptyHint="Semua rombel sudah punya wali."
          renderItem={(r) => (
            <div className="flex items-center justify-between gap-2 text-sm">
              <Link
                to="/sch/$sekolah/akademik/$ta/kelas/$kodeKelas"
                params={{ sekolah, ta: taParam, kodeKelas: r.name }}
                className="min-w-0 truncate font-medium text-fg hover:underline"
              >
                {r.nama_rombel ?? r.name}
              </Link>
              <Link
                to="/sch/$sekolah/akademik/$ta/kelas/rombel"
                params={{ sekolah, ta: taParam }}
                className="shrink-0 text-xs text-brand hover:underline"
              >
                Tunjuk Wali
              </Link>
            </div>
          )}
        />

        <FixItTray
          title="Over / Penuh"
          tone="warning"
          description="Kapasitas terlampaui atau tercapai."
          items={[...defects.overKapasitas, ...defects.penuh.filter((p) => !defects.overKapasitas.includes(p))]}
          emptyHint="Tidak ada rombel over-kapasitas."
          renderItem={(r) => {
            const isi = r.jumlah_siswa ?? 0;
            const cap = r.kapasitas ?? 0;
            const over = cap > 0 && isi > cap;
            return (
              <div className="flex items-center justify-between gap-2 text-sm">
                <Link
                  to="/sch/$sekolah/akademik/$ta/kelas/$kodeKelas"
                  params={{ sekolah, ta: taParam, kodeKelas: r.name }}
                  className="min-w-0 truncate font-medium text-fg hover:underline"
                >
                  {r.nama_rombel ?? r.name}
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`tabular-nums text-xs ${over ? "text-rose-500" : "text-amber-600"}`}>
                    {isi}/{cap}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setBumpRombel(r.name)}>
                    Kelola
                  </Button>
                </span>
              </div>
            );
          }}
        />

        <OrphanTray
          sekolah={sekolah}
          tahunAjaran={ta}
          rombelOptions={rows}
          onPlaced={refetchBoard}
        />
      </div>

      <SectionCard title="Navigasi" description="Kelola struktur rombel.">
        <div className="grid gap-2 sm:grid-cols-3">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              params={{ sekolah, ta: taParam }}
              className="flex items-center gap-3 rounded-md border border-border bg-bg px-3 py-2.5 text-sm hover:border-brand/40 hover:bg-brand/5 transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand">
                {q.icon}
              </span>
              <span className="font-medium text-fg">{q.label}</span>
            </Link>
          ))}
        </div>
      </SectionCard>

      <RolloverDrawer
        open={rolloverOpen}
        onClose={() => setRolloverOpen(false)}
        rombelOptions={rows}
        taOptions={taList}
        defaultTaAsal={ta}
      />

      <GeneratorModal
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        sekolah={sekolah}
        tahunAjaran={ta}
        onCreated={refetchBoard}
      />

      <BumpModal
        open={!!bumpRombel}
        onClose={() => setBumpRombel(null)}
        rombel={bumpRombel ?? ""}
        onDone={refetchBoard}
      />
    </div>
  );
}
