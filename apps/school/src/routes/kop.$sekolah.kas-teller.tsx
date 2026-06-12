import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { SesiKasForm } from "../components/koperasi/SesiKasForm";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

type Row = {
  name: string;
  teller: string;
  tanggal?: string;
  shift?: string;
  modal_kas?: number;
  total_denominasi_tutup?: number;
  selisih?: number;
  status: string;
};

const STATUS_TONE: Record<string, "brand" | "warning" | "success" | "neutral"> = {
  Aktif: "brand",
  "Pending Approval": "warning",
  Selesai: "success",
  Draft: "neutral",
};

const COLUMNS: Column<Row>[] = [
  {
    key: "name",
    header: "Sesi",
    sortable: true,
    cell: (r) => <span className="font-mono text-xs">{r.name}</span>,
  },
  { key: "teller", header: "Teller", sortable: true, cell: (r) => r.teller },
  { key: "tanggal", header: "Tanggal", sortable: true, cell: (r) => r.tanggal ?? "—" },
  { key: "shift", header: "Shift", cell: (r) => r.shift ?? "—" },
  {
    key: "modal_kas",
    header: "Modal",
    align: "right",
    cell: (r) =>
      r.modal_kas !== undefined ? (
        <span className="tabular-nums">Rp {r.modal_kas.toLocaleString("id-ID")}</span>
      ) : (
        "—"
      ),
  },
  {
    key: "total_denominasi_tutup",
    header: "Fisik Tutup",
    align: "right",
    cell: (r) =>
      r.total_denominasi_tutup !== undefined ? (
        <span className="tabular-nums">
          Rp {r.total_denominasi_tutup.toLocaleString("id-ID")}
        </span>
      ) : (
        "—"
      ),
  },
  {
    key: "selisih",
    header: "Selisih",
    align: "right",
    cell: (r) => {
      if (r.selisih === undefined || r.selisih === null) return "—";
      const tone = r.selisih === 0 ? "text-success" : r.selisih > 0 ? "text-info" : "text-danger";
      return (
        <span className={`tabular-nums ${tone}`}>
          {r.selisih > 0 ? "+" : ""}
          Rp {r.selisih.toLocaleString("id-ID")}
        </span>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>
        {r.status}
      </Badge>
    ),
  },
];

function KasTellerPage() {
  const [bukaOpen, setBukaOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <KoperasiPageGuide id="kas-teller" />
      <ResourceListPage<Row>
        key={refreshKey}
        eyebrow="Koperasi"
        title="Sesi Kas Teller"
        description="Buka/tutup sesi kas + rekonsiliasi denominasi."
        doctype="Sesi Kas Teller"
        fields={[
          "name",
          "teller",
          "tanggal",
          "shift",
          "modal_kas",
          "total_denominasi_tutup",
          "selisih",
          "status",
        ]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name", "teller"]}
        selectFilters={[
          {
            key: "status",
            label: "Status",
            field: "status",
            options: ["Semua", "Aktif", "Pending Approval", "Selesai", "Draft"].map((v) => ({
              value: v,
              label: v,
            })),
          },
        ]}
        addLabel="Buka Sesi"
        onAdd={() => setBukaOpen(true)}
      />

      {bukaOpen ? (
        <SesiKasForm
          mode="buka"
          onClose={() => setBukaOpen(false)}
          onSuccess={() => {
            setBukaOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      ) : null}
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/kas-teller")({ component: KasTellerPage });
