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
  type Column,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList, useResourceUpdate } from "@sekolahpro/api-client";
import { DOCTYPE, type AccountingDimension } from "../data/akuntansi";

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
      <PageHeader title="Accounting Dimension" description="Dimensi pelaporan tambahan untuk transaksi akuntansi." actions={<Button onClick={() => { setEditing(null); setForm({}); setOpen(true); }}>+ Dimensi</Button>} />
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

export const Route = createFileRoute("/$sekolah/akuntansi/anggaran/dimensi")({ component: DimensiPage });
