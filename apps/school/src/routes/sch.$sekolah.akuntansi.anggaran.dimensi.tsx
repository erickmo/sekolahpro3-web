/**
 * Accounting Dimension management page — Keuangan hub.
 *
 * CRUD over reporting dimensions via an inline modal. Presentation-only
 * redesign: adds a page guide, a distribution viz (wajib vs opsional), and a
 * glossary tooltip on the dimension concept. All CRUD/modal/data logic
 * (useResourceList/Create/Update, DOCTYPE, handleSave) is preserved verbatim.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  FormField,
  FormGrid,
  Input,
  Modal,
  PageHeader,
  SectionCard,
  Select,
  GlossaryTooltip,
  type Column,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList, useResourceUpdate } from "@sekolahpro/api-client";
import { DOCTYPE, type AccountingDimension } from "../data/akuntansi";
import { KeuanganPageGuide } from "../components/keuangan";
import { DistributionBar } from "../components/viz";

const DIMENSION_DEF = "Accounting Dimension — atribut pelaporan tambahan (mis. Proyek, Program) yang dilekatkan pada transaksi agar laporan bisa dipotong per dimensi.";

function DimensiPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AccountingDimension | null>(null);
  const [form, setForm] = useState<Partial<AccountingDimension>>({});
  const [busy, setBusy] = useState(false);

  const list = useResourceList<AccountingDimension>(DOCTYPE.ACCOUNTING_DIMENSION, {
    fields: ["name", "dimension_name", "document_type", "mandatory", "disabled"],
    order_by: "name asc",
    limit_page_length: 0,
  });
  const create = useResourceCreate<AccountingDimension>(DOCTYPE.ACCOUNTING_DIMENSION);
  const update = useResourceUpdate<AccountingDimension>(DOCTYPE.ACCOUNTING_DIMENSION);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.dimension_name?.toLowerCase().includes(n));
  }, [list.data, q]);

  // Distribusi wajib vs opsional, dihitung dari data yang sudah diambil (read-only).
  const mandatoryDist = useMemo(() => {
    const all = list.data ?? [];
    let wajib = 0;
    let opsional = 0;
    for (const r of all) {
      if (r.mandatory) wajib += 1;
      else opsional += 1;
    }
    return [
      { label: "Wajib", value: wajib, tone: "amber" as const },
      { label: "Opsional", value: opsional, tone: "neutral" as const },
    ];
  }, [list.data]);

  const cols: Column<AccountingDimension>[] = [
    { key: "name", header: "Nama", cell: (r) => r.dimension_name },
    { key: "document_type", header: "Document Type", cell: (r) => r.document_type ?? "—" },
    { key: "mandatory", header: "Mandatory", cell: (r) => r.mandatory ? <Badge tone="warning">Wajib</Badge> : "—", align: "center" },
    { key: "disabled", header: "Status", cell: (r) => r.disabled ? <Badge tone="danger">Disabled</Badge> : <Badge tone="success">Aktif</Badge>, align: "center" },
  ];

  const handleSave = async () => {
    setBusy(true);
    try {
      const doc: Record<string, unknown> = {
        dimension_name: form.dimension_name,
        document_type: form.document_type ?? null,
        mandatory: form.mandatory ? 1 : 0,
        disabled: form.disabled ? 1 : 0,
      };
      if (editing) await update.mutateAsync({ name: editing.name, patch: doc });
      else await create.mutateAsync(doc);
      await list.refetch();
      setOpen(false);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Accounting Dimension"
        description={
          <span className="inline-flex items-center gap-1">
            <GlossaryTooltip term="Accounting Dimension" definition={DIMENSION_DEF} />
            {" "}— dimensi pelaporan tambahan untuk transaksi akuntansi.
          </span>
        }
        actions={<Button onClick={() => { setEditing(null); setForm({}); setOpen(true); }}>+ Dimensi</Button>}
      />

      <KeuanganPageGuide
        storageId="anggaran-dimensi"
        intro="Dimensi akuntansi menambah sudut pandang pelaporan (mis. Proyek, Program) pada transaksi, melengkapi akun dan cost center."
        steps={[
          { title: "Definisikan dimensi", detail: "Beri nama dimensi dan tentukan document type yang akan memakainya (mis. Journal Entry)." },
          { title: "Atur wajib atau opsional", detail: "Tandai Wajib bila setiap transaksi pada document type tersebut harus mengisi dimensi ini.", roles: ["akuntan"] },
          { title: "Nonaktifkan bila tak dipakai", detail: "Set Disabled untuk berhenti memakai dimensi tanpa menghapus data historis." },
        ]}
        tips={["Dimensi yang Wajib akan memblokir penyimpanan transaksi bila belum diisi — gunakan seperlunya."]}
      />

      {list.data && list.data.length > 0 && (
        <SectionCard title="Komposisi Dimensi">
          <DistributionBar segments={mandatoryDist} />
        </SectionCard>
      )}

      <FilterBar search={{ value: q, placeholder: "Cari…", onChange: setQ }} />
      <SectionCard padded={false}>
        <DataTable<AccountingDimension>
          data={rows} columns={cols} rowKey={(r) => r.name}
          onRowClick={(r) => { setEditing(r); setForm(r); setOpen(true); }}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada dimensi."}</div>}
        />
      </SectionCard>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.dimension_name}` : "Dimensi Baru"}>
        <FormGrid cols={2}>
          <FormField label="Nama" required>
            <Input value={form.dimension_name ?? ""} onChange={(e) => setForm({ ...form, dimension_name: e.target.value })} />
          </FormField>
          <FormField label="Document Type">
            <Input value={form.document_type ?? ""} onChange={(e) => setForm({ ...form, document_type: e.target.value })} placeholder="contoh: Journal Entry" />
          </FormField>
          <FormField label="Mandatory">
            <Select value={String(form.mandatory ?? 0)} onChange={(e) => setForm({ ...form, mandatory: e.target.value === "1" ? 1 : 0 })}>
              <option value="0">Opsional</option>
              <option value="1">Wajib</option>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={String(form.disabled ?? 0)} onChange={(e) => setForm({ ...form, disabled: e.target.value === "1" ? 1 : 0 })}>
              <option value="0">Aktif</option>
              <option value="1">Disabled</option>
            </Select>
          </FormField>
        </FormGrid>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
          <Button onClick={handleSave} disabled={busy || !form.dimension_name}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/anggaran/dimensi")({ component: DimensiPage });
