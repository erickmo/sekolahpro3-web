import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { LAPORAN_TERJADWAL_FIELDS } from "../data/create-schemas";

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

function LaporanPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
    <ResourceListPage<Row>
      eyebrow="Operasional"
      title="Laporan"
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
  );
}

export const Route = createFileRoute("/$sekolah/laporan")({ component: LaporanPage });
