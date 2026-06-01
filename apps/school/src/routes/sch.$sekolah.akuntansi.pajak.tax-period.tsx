/**
 * Daftar Tax Period (periode pelaporan pajak per jenis).
 *
 * Presentation-only redesign: adds a workflow guide, an Open/Closed distribution
 * bar, and a glossary tooltip. The list/create/update hooks, filters, columns,
 * and modal save logic are unchanged.
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
  GlossaryTooltip,
  Input,
  Modal,
  PageHeader,
  SectionCard,
  Select,
  type Column,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList, useResourceUpdate } from "@sekolahpro/api-client";
import { DOCTYPE, TAX_PERIOD_TYPES, type TaxPeriod, type TaxPeriodType } from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";
import { KeuanganPageGuide } from "../components/keuangan";
import { DistributionBar, type DistributionSegment } from "../components/viz";
import { defOf } from "../lib/glossary";

const ALL = "Semua";

function TaxPeriodPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState(ALL);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaxPeriod | null>(null);
  const [form, setForm] = useState<Partial<TaxPeriod>>({ tax_type: "PPN", month: 1, year: new Date().getFullYear() });
  const [busy, setBusy] = useState(false);
  const company = useActiveCompany();

  const list = useResourceList<TaxPeriod>(DOCTYPE.TAX_PERIOD, {
    fields: ["name", "period_name", "tax_type", "month", "year", "company", "is_closed"],
    filters: withCompanyFilter(undefined, company),
    order_by: "year desc, month desc",
    limit_page_length: 200,
  });
  const create = useResourceCreate<TaxPeriod>(DOCTYPE.TAX_PERIOD);
  const update = useResourceUpdate<TaxPeriod>(DOCTYPE.TAX_PERIOD);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    return all.filter((r) => {
      if (type !== ALL && r.tax_type !== type) return false;
      if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [list.data, q, type]);

  // Distribusi periode menurut status Open/Closed untuk visualisasi ringkas.
  const statusDist = useMemo<DistributionSegment[]>(() => {
    const all = list.data ?? [];
    const closed = all.filter((r) => r.is_closed).length;
    return [
      { label: "Open", value: all.length - closed, tone: "emerald" },
      { label: "Closed", value: closed, tone: "rose" },
    ];
  }, [list.data]);
  const hasPeriods = (list.data ?? []).length > 0;

  const cols: Column<TaxPeriod>[] = [
    { key: "name", header: "Period Name", cell: (r) => r.period_name },
    { key: "tax_type", header: "Tax Type", cell: (r) => <Badge tone="brand">{r.tax_type}</Badge> },
    { key: "month", header: "Bulan", cell: (r) => String(r.month), align: "center" },
    { key: "year", header: "Tahun", cell: (r) => String(r.year), align: "center" },
    { key: "company", header: "Company", cell: (r) => r.company ?? "—" },
    { key: "is_closed", header: "Status", cell: (r) => r.is_closed ? <Badge tone="danger">Closed</Badge> : <Badge tone="success">Open</Badge>, align: "center" },
  ];

  const handleSave = async () => {
    setBusy(true);
    try {
      const doc: Record<string, unknown> = {
        period_name: form.period_name,
        tax_type: form.tax_type,
        month: form.month,
        year: form.year,
        company: form.company ?? company ?? null,
        is_closed: form.is_closed ? 1 : 0,
      };
      if (editing) await update.mutateAsync({ name: editing.name, patch: doc });
      else await create.mutateAsync(doc);
      await list.refetch();
      setOpen(false);
    } finally { setBusy(false); }
  };

  const openModal = (tp: TaxPeriod | null) => {
    setEditing(tp);
    setForm(tp ?? { tax_type: "PPN", month: 1, year: new Date().getFullYear() });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tax Period"
        description={<><GlossaryTooltip term="Tax Period" definition={defOf("Tax Period") ?? "Periode (bulan/tahun) sebagai wadah pelaporan pajak per jenis."} />: periode pelaporan pajak per jenis.</>}
        actions={<Button onClick={() => openModal(null)}>+ Tax Period</Button>}
      />
      <KeuanganPageGuide
        storageId="tax-period-list"
        intro="Definisikan periode pajak (bulan/tahun per jenis) sebagai acuan SPT dan e-Faktur. Tutup periode setelah pelaporan selesai."
        steps={[
          { title: "Buat periode", detail: "Klik + Tax Period, isi nama periode, jenis pajak, bulan, dan tahun." },
          { title: "Edit dari tabel", detail: "Klik baris untuk mengubah data atau menutup periode." },
          { title: "Tutup periode", detail: "Set status Closed agar tidak ada lagi transaksi pajak masuk ke periode itu." },
        ]}
        tips={["Tutup periode hanya setelah SPT dan e-Faktur terkait sudah dilaporkan."]}
      />
      {hasPeriods ? (
        <SectionCard title="Distribusi Status Periode" description="Perbandingan periode yang masih Open dan yang sudah Closed.">
          <DistributionBar segments={statusDist} />
        </SectionCard>
      ) : null}
      <FilterBar
        search={{ value: q, placeholder: "Cari…", onChange: setQ }}
        filters={[{
          key: "type", label: "Tax Type", value: type,
          options: [{ value: ALL, label: ALL }, ...TAX_PERIOD_TYPES.map((v) => ({ value: v, label: v }))],
          onChange: setType,
        }]}
      />
      <SectionCard padded={false}>
        <DataTable<TaxPeriod>
          data={rows} columns={cols} rowKey={(r) => r.name}
          onRowClick={openModal}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada period."}</div>}
        />
      </SectionCard>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.period_name}` : "Tax Period Baru"}>
        <FormGrid cols={2}>
          <FormField label="Period Name" required>
            <Input value={form.period_name ?? ""} onChange={(e) => setForm({ ...form, period_name: e.target.value })} placeholder="PPN-2026-01" />
          </FormField>
          <FormField label="Tax Type" required>
            <Select value={form.tax_type ?? "PPN"} onChange={(e) => setForm({ ...form, tax_type: e.target.value as TaxPeriodType })}>
              {TAX_PERIOD_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </FormField>
          <FormField label="Month" required>
            <Input type="number" min={1} max={12} value={form.month ?? 1} onChange={(e) => setForm({ ...form, month: Number(e.target.value) || 1 })} />
          </FormField>
          <FormField label="Year" required>
            <Input type="number" value={form.year ?? new Date().getFullYear()} onChange={(e) => setForm({ ...form, year: Number(e.target.value) || new Date().getFullYear() })} />
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
          <Button onClick={handleSave} disabled={busy || !form.period_name}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/pajak/tax-period")({ component: TaxPeriodPage });
