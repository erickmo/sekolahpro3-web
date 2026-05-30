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
import { DOCTYPE, formatTanggal, type AccountingPeriod } from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";

function PeriodPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AccountingPeriod | null>(null);
  const [form, setForm] = useState<Partial<AccountingPeriod>>({});
  const [busy, setBusy] = useState(false);
  const company = useActiveCompany();

  const list = useResourceList<AccountingPeriod>(DOCTYPE.ACCOUNTING_PERIOD, {
    fields: ["name", "period_name", "fiscal_year", "start_date", "end_date", "is_closed", "company"],
    filters: withCompanyFilter(undefined, company),
    order_by: "start_date desc",
    limit_page_length: 200,
  });
  const create = useResourceCreate<AccountingPeriod>(DOCTYPE.ACCOUNTING_PERIOD);
  const update = useResourceUpdate<AccountingPeriod>(DOCTYPE.ACCOUNTING_PERIOD);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.period_name?.toLowerCase().includes(n));
  }, [list.data, q]);

  const cols: Column<AccountingPeriod>[] = [
    { key: "period_name", header: "Nama", cell: (r) => r.period_name },
    { key: "fiscal_year", header: "Fiscal Year", cell: (r) => r.fiscal_year },
    { key: "start", header: "Mulai", cell: (r) => formatTanggal(r.start_date) },
    { key: "end", header: "Selesai", cell: (r) => formatTanggal(r.end_date) },
    { key: "company", header: "Company", cell: (r) => r.company ?? "—" },
    { key: "is_closed", header: "Status", cell: (r) => r.is_closed ? <Badge tone="danger">Closed</Badge> : <Badge tone="success">Open</Badge>, align: "center" },
  ];

  const openModal = (r: AccountingPeriod | null) => { setEditing(r); setForm(r ?? {}); setOpen(true); };
  const handleSave = async () => {
    setBusy(true);
    try {
      const doc: Record<string, unknown> = {
        period_name: form.period_name,
        fiscal_year: form.fiscal_year,
        start_date: form.start_date,
        end_date: form.end_date,
        is_closed: form.is_closed ? 1 : 0,
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
      <PageHeader title="Accounting Period" description="Periode akuntansi (bulan/quarter)." actions={<Button onClick={() => openModal(null)}>+ Period</Button>} />
      <FilterBar search={{ value: q, placeholder: "Cari…", onChange: setQ }} />
      <SectionCard padded={false}>
        <DataTable<AccountingPeriod>
          data={rows} columns={cols} rowKey={(r) => r.name}
          onRowClick={openModal}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada period."}</div>}
        />
      </SectionCard>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.period_name}` : "Accounting Period Baru"}>
        <FormGrid cols={2}>
          <FormField label="Period Name" required>
            <Input value={form.period_name ?? ""} onChange={(e) => setForm({ ...form, period_name: e.target.value })} />
          </FormField>
          <FormField label="Fiscal Year" required>
            <Input value={form.fiscal_year ?? ""} onChange={(e) => setForm({ ...form, fiscal_year: e.target.value })} />
          </FormField>
          <FormField label="Start Date" required>
            <Input type="date" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </FormField>
          <FormField label="End Date" required>
            <Input type="date" value={form.end_date ?? ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </FormField>
          <FormField label="Company" hint="Auto: company sekolah aktif">
            <Input value={form.company ?? company} disabled />
          </FormField>
          <FormField label="Status">
            <Select value={String(form.is_closed ?? 0)} onChange={(e) => setForm({ ...form, is_closed: e.target.value === "1" ? 1 : 0 })}>
              <option value="0">Open</option>
              <option value="1">Closed</option>
            </Select>
          </FormField>
        </FormGrid>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
          <Button onClick={handleSave} disabled={busy || !form.period_name || !form.fiscal_year || !form.start_date || !form.end_date}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/referensi/period")({ component: PeriodPage });
