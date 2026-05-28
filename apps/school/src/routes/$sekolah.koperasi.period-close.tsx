import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@sekolahpro/auth";
import { Badge, Button, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { GenericFormModal, type MasterField } from "../components/koperasi-master/GenericFormModal";
import { StatusActionModal } from "../components/koperasi-admin/StatusActionModal";

/**
 * Period Close — Supervisor tutup/reopen periode operasional.
 *
 * Status: Open → Closed (tutup) → Reopened (jika perlu re-buka).
 * Closed periode bertindak sebagai gate transaksi backdated di
 * backend (controller Periode Tutup Koperasi).
 */

type Row = {
  name: string;
  nama_periode: string;
  status: string;
  tanggal_mulai?: string;
  tanggal_akhir?: string;
  tanggal_tutup?: string;
  oleh_user?: string;
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Open: "success",
  Closed: "neutral",
  Reopened: "warning",
};

const CREATE_FIELDS: MasterField[] = [
  { name: "nama_periode", label: "Nama Periode", type: "data", required: true, placeholder: "Mei 2026" },
  { name: "tanggal_mulai", label: "Tanggal Mulai", type: "date", required: true },
  { name: "tanggal_akhir", label: "Tanggal Akhir", type: "date", required: true },
];

function PeriodClosePage() {
  const session = useSession();
  const [createOpen, setCreateOpen] = useState(false);
  const [actionRow, setActionRow] = useState<Row | null>(null);
  const [actionTarget, setActionTarget] = useState<"Closed" | "Reopened" | null>(null);

  const onAction = (row: Row, target: "Closed" | "Reopened") => {
    setActionRow(row);
    setActionTarget(target);
  };

  const columns: Column<Row>[] = [
    { key: "name", header: "ID", cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
    { key: "nama_periode", header: "Periode", sortable: true },
    {
      key: "tanggal_mulai",
      header: "Rentang",
      cell: (r) => `${r.tanggal_mulai ?? "—"} → ${r.tanggal_akhir ?? "—"}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge>,
    },
    { key: "tanggal_tutup", header: "Tgl Tutup", cell: (r) => r.tanggal_tutup ?? "—" },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      cell: (r) =>
        r.status === "Open" ? (
          <Button size="sm" variant="outline" onClick={() => onAction(r, "Closed")}>Tutup</Button>
        ) : r.status === "Closed" ? (
          <Button size="sm" variant="outline" onClick={() => onAction(r, "Reopened")}>Reopen</Button>
        ) : (
          <span className="text-xs text-muted-fg">—</span>
        ),
    },
  ];

  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title="Period Close"
        description="Tutup periode operasional sebagai gate transaksi backdated."
        doctype="Periode Tutup Koperasi"
        fields={["name", "nama_periode", "status", "tanggal_mulai", "tanggal_akhir", "tanggal_tutup", "oleh_user"]}
        rowKey={(r) => r.name}
        columns={columns}
        defaultSort={{ key: "tanggal_mulai", dir: "desc" }}
        searchFields={["name", "nama_periode"]}
        selectFilters={[
          {
            key: "status", label: "Status", field: "status",
            options: ["Semua", "Open", "Closed", "Reopened"].map((v) => ({ value: v, label: v })),
          },
        ]}
        addLabel="Buat Periode"
        onAdd={() => setCreateOpen(true)}
      />

      <GenericFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        doctype="Periode Tutup Koperasi"
        title="Periode"
        fields={CREATE_FIELDS}
      />

      {actionRow && actionTarget ? (
        <StatusActionModal
          open
          onClose={() => { setActionRow(null); setActionTarget(null); }}
          doctype="Periode Tutup Koperasi"
          recordName={actionRow.name}
          targetStatus={actionTarget}
          title={actionTarget === "Closed" ? `Tutup periode ${actionRow.nama_periode}` : `Reopen ${actionRow.nama_periode}`}
          description={
            actionTarget === "Closed"
              ? "Setelah ditutup, transaksi backdated dalam rentang ini akan ditolak."
              : "Reopen membuka kembali periode untuk koreksi. Perlu approval ulang saat tutup."
          }
          extraFields={[
            { name: "catatan", label: "Catatan", type: "text", required: actionTarget === "Reopened", placeholder: "Alasan…" },
          ]}
          timestampField={actionTarget === "Closed" ? "tanggal_tutup" : undefined as unknown as string}
          operatorField="oleh_user"
          currentUser={session.user ?? undefined}
        />
      ) : null}
    </>
  );
}

export const Route = createFileRoute("/$sekolah/koperasi/period-close")({ component: PeriodClosePage });
