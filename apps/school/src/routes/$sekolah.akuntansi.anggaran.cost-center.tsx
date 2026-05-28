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
import { DOCTYPE, type CostCenter } from "../data/akuntansi";

function CostCenterPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [form, setForm] = useState<Partial<CostCenter>>({});
  const [busy, setBusy] = useState(false);

  const list = useResourceList<CostCenter>(DOCTYPE.COST_CENTER, {
    fields: ["name", "cost_center_name", "parent_cost_center", "is_group", "company", "disabled"],
    order_by: "name asc",
    limit_page_length: 0,
  });
  const create = useResourceCreate<CostCenter>(DOCTYPE.COST_CENTER);
  const update = useResourceUpdate<CostCenter>(DOCTYPE.COST_CENTER);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.cost_center_name?.toLowerCase().includes(n) || r.name.toLowerCase().includes(n));
  }, [list.data, q]);

  const cols: Column<CostCenter>[] = [
    { key: "name", header: "Nama", cell: (r) => r.cost_center_name },
    { key: "parent", header: "Parent", cell: (r) => r.parent_cost_center ?? "—" },
    { key: "is_group", header: "Group", cell: (r) => r.is_group ? <Badge tone="brand">Group</Badge> : "—", align: "center" },
    { key: "company", header: "Company", cell: (r) => <span className="text-xs">{r.company ?? "—"}</span> },
    { key: "disabled", header: "Status", cell: (r) => r.disabled ? <Badge tone="danger">Disabled</Badge> : <Badge tone="success">Aktif</Badge>, align: "center" },
  ];

  const openModal = (cc: CostCenter | null) => { setEditing(cc); setForm(cc ?? { is_group: 0, disabled: 0 }); setOpen(true); };

  const handleSave = async () => {
    setBusy(true);
    try {
      const doc: Record<string, unknown> = {
        cost_center_name: form.cost_center_name,
        parent_cost_center: form.parent_cost_center ?? null,
        is_group: form.is_group ? 1 : 0,
        disabled: form.disabled ? 1 : 0,
        company: form.company ?? null,
      };
      if (editing) await update.mutateAsync({ name: editing.name, patch: doc });
      else await create.mutateAsync(doc);
      await list.refetch();
      setOpen(false);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Cost Center" description="Pusat biaya — struktur pohon." actions={<Button onClick={() => openModal(null)}>+ Cost Center</Button>} />
      <FilterBar search={{ value: q, placeholder: "Cari…", onChange: setQ }} />
      <SectionCard padded={false}>
        <DataTable<CostCenter>
          data={rows} columns={cols} rowKey={(r) => r.name}
          onRowClick={openModal}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada cost center."}</div>}
        />
      </SectionCard>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.cost_center_name}` : "Cost Center Baru"}>
        <FormGrid cols={2}>
          <FormField label="Nama" required>
            <Input value={form.cost_center_name ?? ""} onChange={(e) => setForm({ ...form, cost_center_name: e.target.value })} />
          </FormField>
          <FormField label="Parent Cost Center">
            <Input value={form.parent_cost_center ?? ""} onChange={(e) => setForm({ ...form, parent_cost_center: e.target.value })} />
          </FormField>
          <FormField label="Company">
            <Input value={form.company ?? ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </FormField>
          <FormField label="Tipe">
            <Select value={String(form.is_group ?? 0)} onChange={(e) => setForm({ ...form, is_group: e.target.value === "1" ? 1 : 0 })}>
              <option value="0">Cost Center</option>
              <option value="1">Group</option>
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
          <Button onClick={handleSave} disabled={busy || !form.cost_center_name}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/akuntansi/anggaran/cost-center")({ component: CostCenterPage });
