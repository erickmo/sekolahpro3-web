import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { StatusActionModal } from "../components/koperasi-admin/StatusActionModal";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

/**
 * Laporan PPATK — submit ke goAML.
 *
 * Status: Draft → Pending Submit → Submitted (set referensi_goaml +
 * tanggal_submit + operator). Rejected = bounce back dari goAML, perlu
 * koreksi + re-submit.
 *
 * Jenis: LTKT (Tunai), LTKM (Mencurigakan), LTKL (Luar negeri).
 */

type Row = {
  name: string;
  nomor_laporan: string;
  jenis: string;
  status: string;
  nasabah?: string;
  tanggal_transaksi?: string;
  tanggal_lapor?: string;
  jumlah?: number;
  referensi_goaml?: string;
};

const STATUS_TONE: Record<string, "warning" | "brand" | "success" | "danger" | "neutral"> = {
  Draft: "neutral",
  "Pending Submit": "warning",
  Submitted: "success",
  Rejected: "danger",
};

function PpatkPage() {
  const [actionRow, setActionRow] = useState<Row | null>(null);
  const [actionTarget, setActionTarget] = useState<"Pending Submit" | "Submitted" | null>(null);

  const columns: Column<Row>[] = [
    { key: "nomor_laporan", header: "No Laporan", cell: (r) => <span className="font-mono text-xs">{r.nomor_laporan}</span> },
    { key: "jenis", header: "Jenis", cell: (r) => r.jenis },
    { key: "nasabah", header: "Nasabah", cell: (r) => r.nasabah ?? "—" },
    {
      key: "jumlah", header: "Jumlah", align: "right",
      cell: (r) => r.jumlah !== undefined
        ? <span className="tabular-nums">Rp {r.jumlah.toLocaleString("id-ID")}</span>
        : "—",
    },
    { key: "tanggal_transaksi", header: "Tgl Transaksi", cell: (r) => r.tanggal_transaksi ?? "—" },
    {
      key: "status", header: "Status",
      cell: (r) => <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge>,
    },
    {
      key: "actions", header: "Aksi", align: "right",
      cell: (r) =>
        r.status === "Draft" ? (
          <Button size="sm" variant="outline" onClick={() => { setActionRow(r); setActionTarget("Pending Submit"); }}>
            Ajukan
          </Button>
        ) : r.status === "Pending Submit" || r.status === "Rejected" ? (
          <Button size="sm" onClick={() => { setActionRow(r); setActionTarget("Submitted"); }}>
            Submit goAML
          </Button>
        ) : (
          <span className="text-xs font-mono text-muted-fg">{r.referensi_goaml ?? "—"}</span>
        ),
    },
  ];

  return (
    <>
      <KoperasiPageGuide id="ppatk" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Laporan PPATK"
        description="Laporan LTKT/LTKM/LTKL siap submit ke goAML."
        doctype="Laporan PPATK"
        fields={[
          "name", "nomor_laporan", "jenis", "status", "nasabah",
          "tanggal_transaksi", "tanggal_lapor", "jumlah", "referensi_goaml",
        ]}
        rowKey={(r) => r.name}
        columns={columns}
        defaultSort={{ key: "tanggal_lapor", dir: "desc" }}
        searchFields={["name", "nomor_laporan", "nasabah"]}
        selectFilters={[
          {
            key: "status", label: "Status", field: "status",
            options: ["Semua", "Draft", "Pending Submit", "Submitted", "Rejected"]
              .map((v) => ({ value: v, label: v })),
          },
          {
            key: "jenis", label: "Jenis", field: "jenis",
            options: ["Semua", "LTKT", "LTKM", "LTKL"].map((v) => ({ value: v, label: v })),
          },
        ]}
      />

      {actionRow && actionTarget ? (
        <StatusActionModal
          open
          onClose={() => { setActionRow(null); setActionTarget(null); }}
          doctype="Laporan PPATK"
          recordName={actionRow.name}
          targetStatus={actionTarget}
          title={
            actionTarget === "Pending Submit"
              ? `Ajukan ${actionRow.nomor_laporan} untuk submit`
              : `Submit ${actionRow.nomor_laporan} ke goAML`
          }
          description={
            actionTarget === "Pending Submit"
              ? "Status berubah ke Pending Submit menunggu approval supervisor."
              : "Setelah submit, status final dan referensi goAML akan ditulis."
          }
          extraFields={
            actionTarget === "Submitted"
              ? [{ name: "referensi_goaml", label: "Referensi goAML", type: "data", required: true, placeholder: "GOAML-…" }]
              : []
          }
        />
      ) : null}
    </>
  );
}

export const Route = createFileRoute("/kop/$sekolah/ppatk")({ component: PpatkPage });
