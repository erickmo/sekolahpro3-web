/**
 * Cost Center management page — Keuangan hub.
 *
 * CRUD over cost centers (pusat biaya) via an inline modal. Presentation-only
 * redesign: adds a page guide, an active/disabled distribution viz, and a
 * glossary tooltip on the "Cost Center" term. All CRUD/modal/data logic
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
import { DOCTYPE, type CostCenter } from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";
import { defOf } from "../lib/glossary";
import { KeuanganPageGuide } from "../components/keuangan";
import { DistributionBar } from "../components/viz";

const COST_CENTER_DEF = "Cost Center (pusat biaya) — unit organisasi untuk mengelompokkan dan melacak biaya, disusun sebagai struktur pohon (group dan anak).";

function CostCenterPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [form, setForm] = useState<Partial<CostCenter>>({});
  const [busy, setBusy] = useState(false);
  const company = useActiveCompany();

  const list = useResourceList<CostCenter>(DOCTYPE.COST_CENTER, {
    fields: ["name", "cost_center_name", "parent_cost_center", "is_group", "company", "disabled"],
    filters: withCompanyFilter(undefined, company),
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

  // Distribusi aktif vs disabled, dihitung dari data yang sudah diambil (read-only).
  const statusDist = useMemo(() => {
    const all = list.data ?? [];
    let aktif = 0;
    let disabled = 0;
    for (const r of all) {
      if (r.disabled) disabled += 1;
      else aktif += 1;
    }
    return [
      { label: "Aktif", value: aktif, tone: "emerald" as const },
      { label: "Disabled", value: disabled, tone: "rose" as const },
    ];
  }, [list.data]);

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
        company: form.company ?? company ?? null,
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
        title="Cost Center"
        description={
          <span className="inline-flex items-center gap-1">
            <GlossaryTooltip term="Cost Center" definition={defOf("Cost Center") ?? COST_CENTER_DEF} />
            {" "}— pusat biaya, struktur pohon.
          </span>
        }
        actions={<Button onClick={() => openModal(null)}>+ Cost Center</Button>}
      />

      <KeuanganPageGuide
        storageId="anggaran-cost-center"
        intro="Cost center mengelompokkan biaya sesuai struktur organisasi sekolah sehingga belanja dan anggaran bisa dilacak per unit."
        steps={[
          { title: "Buat struktur pohon", detail: "Buat node Group sebagai induk (mis. 'Operasional'), lalu cost center di bawahnya untuk unit yang menanggung biaya." },
          { title: "Pakai pada anggaran & transaksi", detail: "Cost center dipilih saat membuat budget dan saat mencatat transaksi agar realisasi terbaca per unit.", roles: ["akuntan"] },
          { title: "Nonaktifkan, jangan hapus", detail: "Unit yang tidak dipakai lagi cukup di-set Disabled supaya riwayat transaksinya tetap utuh." },
        ]}
        tips={["Node bertipe Group hanya untuk pengelompokan — transaksi dicatat pada cost center non-group di bawahnya."]}
      />

      {list.data && list.data.length > 0 && (
        <SectionCard title="Status Cost Center">
          <DistributionBar segments={statusDist} />
        </SectionCard>
      )}

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
          <FormField label="Company" hint="Auto: company sekolah aktif">
            <Input value={form.company ?? company} disabled />
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

export const Route = createFileRoute("/sch/$sekolah/akuntansi/anggaran/cost-center")({ component: CostCenterPage });
