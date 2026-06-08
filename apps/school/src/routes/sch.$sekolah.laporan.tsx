import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Badge, ModuleFlow, PageHeader, type Column, type ModuleFlowStep } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { LAPORAN_TERJADWAL_FIELDS } from "../data/create-schemas";
import { PageGuide } from "../components/guide";
import { MISC_PAGE_GUIDES } from "../components/guide/miscPageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";
import { PusatLaporHero } from "../components/laporan/PusatLaporHero";
import { KotakMasalahData } from "../components/laporan/KotakMasalahData";
import { SemuaLaporanCatalog } from "../components/laporan/SemuaLaporanCatalog";
import { SusunPaket } from "../components/laporan/SusunPaket";

type LaporanTab = "pusat" | "katalog" | "jadwal";

// Wired to backend DocType: "Laporan Terjadwal"
// /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/laporan/doctype/laporan_terjadwal

type Row = {
  name: string;
  nama?: string;
  report?: string;
  periode?: string;
  format?: string;
  enabled?: number;
  next_run?: string;
  last_run?: string;
  modified?: string;
};

const PERIODE_OPTS = ["Semua","Harian","Mingguan","Bulanan","Semesteran","Tahunan"].map((v) => ({ value: v, label: v }));
const FORMAT_OPTS = ["Semua","CSV","Excel","PDF"].map((v) => ({ value: v, label: v }));

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const COLUMNS: Column<Row>[] = [
  { key: "nama", header: "Nama", sortable: true,
    cell: (r) => (
      <div className="min-w-0">
        <div className="font-medium text-fg truncate">{r.nama ?? r.name}</div>
        <div className="text-xs text-muted-fg truncate">{r.report ?? "—"}</div>
      </div>
    ) },
  { key: "periode", header: "Periode",
    cell: (r) => <Badge tone="brand">{r.periode ?? "—"}</Badge> },
  { key: "format", header: "Format",
    cell: (r) => <Badge tone="neutral">{r.format ?? "—"}</Badge> },
  { key: "next_run", header: "Berikutnya",
    cell: (r) => <span className="text-sm tabular-nums">{fmtDate(r.next_run)}</span> },
  { key: "last_run", header: "Terakhir",
    cell: (r) => <span className="text-sm tabular-nums">{fmtDate(r.last_run)}</span> },
  { key: "enabled", header: "Status",
    cell: (r) => <Badge tone={r.enabled ? "success" : "neutral"} dot>{r.enabled ? "Aktif" : "Nonaktif"}</Badge> },
];

const LAPORAN_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "pilih", label: "Pilih Report", hint: "Tentukan jenis laporan" },
  { key: "jadwal", label: "Atur Jadwal", hint: "Periode + format output" },
  { key: "aktifkan", label: "Aktifkan", hint: "Toggle status aktif" },
  { key: "monitor", label: "Pantau Eksekusi", hint: "Cek next_run & last_run" },
];

function LaporanPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const [tab, setTab] = useState<LaporanTab>("pusat");
  const [open, setOpen] = useState(false);
  const [susunKewajiban, setSusunKewajiban] = useState<string | null>(null);
  return (
    <>
      <div className="px-6 pt-6 space-y-6">
        <PageHeader
          eyebrow="Operasional"
          title="Pusat Lapor"
          description="Susun & kirim laporan compliance tepat waktu, lengkap, format benar."
        />
        <PageGuide
          storageNamespace="school-guide:"
          storageId="laporan"
          title={MISC_PAGE_GUIDES.laporan.title}
          intro={MISC_PAGE_GUIDES.laporan.intro}
          steps={MISC_PAGE_GUIDES.laporan.steps}
          tips={MISC_PAGE_GUIDES.laporan.tips}
          roleLabels={SCHOOL_ROLE_LABEL}
        />
        <div className="flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setTab("pusat")}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === "pusat" ? "border-brand text-brand" : "border-transparent text-muted-fg hover:text-fg"}`}
          >
            Pusat Lapor
          </button>
          <button
            type="button"
            onClick={() => setTab("katalog")}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === "katalog" ? "border-brand text-brand" : "border-transparent text-muted-fg hover:text-fg"}`}
          >
            Semua Laporan
          </button>
          <button
            type="button"
            onClick={() => setTab("jadwal")}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === "jadwal" ? "border-brand text-brand" : "border-transparent text-muted-fg hover:text-fg"}`}
          >
            Jadwal Otomatis
          </button>
        </div>
        {tab === "pusat" ? (
          <>
            <KotakMasalahData sekolah={sekolah} />
            <PusatLaporHero onSusun={setSusunKewajiban} />
          </>
        ) : null}
        {tab === "katalog" ? <SemuaLaporanCatalog sekolah={sekolah} /> : null}
      </div>

      <SusunPaket
        open={!!susunKewajiban}
        onClose={() => setSusunKewajiban(null)}
        kewajibanId={susunKewajiban}
        sekolah={sekolah}
      />

      {tab === "jadwal" ? (
        <>
          <div className="px-6 pt-2">
            <ModuleFlow
              title="Alur Penjadwalan Laporan"
              description="Langkah menjadwalkan laporan otomatis."
              steps={LAPORAN_FLOW_STEPS}
            />
          </div>
          <ResourceListPage<Row>
            eyebrow="Operasional"
            title="Jadwal Otomatis"
            description="Pustaka laporan terjadwal."
            doctype="Laporan Terjadwal"
            fields={["name", "nama", "report", "periode", "format", "enabled", "next_run", "last_run", "modified"]}
            rowKey={(r) => r.name}
            columns={COLUMNS}
            defaultSort={{ key: "modified", dir: "desc" }}
            searchFields={["name", "nama", "report"]}
            selectFilters={[
              { key: "periode", label: "Periode", field: "periode", options: PERIODE_OPTS },
              { key: "format", label: "Format", field: "format", options: FORMAT_OPTS },
            ]}
            addLabel="Jadwalkan Laporan"
            onAdd={() => setOpen(true)}
          />
          <ResourceCreateModal
            open={open}
            onClose={() => setOpen(false)}
            doctype="Laporan Terjadwal"
            title="Jadwalkan Laporan"
            description="Buat jadwal laporan terjadwal baru."
            fields={LAPORAN_TERJADWAL_FIELDS}
          />
        </>
      ) : null}
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/laporan")({ component: LaporanPage });
