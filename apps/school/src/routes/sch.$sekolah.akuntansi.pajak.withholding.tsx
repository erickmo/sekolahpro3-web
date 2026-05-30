import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Alert,
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
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  formatRupiah,
  formatTanggal,
  submitDoc,
  WHT_TAX_TYPES,
  whtStatusBadge,
  type WhtTaxType,
  type WithholdingTaxEntry,
} from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";

const ALL = "Semua";

function WithholdingPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState(ALL);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const company = useActiveCompany();
  const [form, setForm] = useState<Partial<WithholdingTaxEntry>>({
    tax_type: "PPh23",
    posting_date: new Date().toISOString().slice(0, 10),
    base_amount: 0,
    tax_rate: 2,
    tax_amount: 0,
  });

  const list = useResourceList<WithholdingTaxEntry>(DOCTYPE.WITHHOLDING_TAX_ENTRY, {
    fields: ["name", "tax_type", "party_type", "party", "npwp", "posting_date", "base_amount", "tax_rate", "tax_amount", "status", "docstatus"],
    filters: withCompanyFilter(undefined, company),
    order_by: "posting_date desc, creation desc",
    limit_page_length: 200,
  });
  const create = useResourceCreate<WithholdingTaxEntry>(DOCTYPE.WITHHOLDING_TAX_ENTRY);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    return all.filter((r) => {
      if (type !== ALL && r.tax_type !== type) return false;
      if (q) {
        const n = q.toLowerCase();
        if (!r.name.toLowerCase().includes(n) && !(r.party ?? "").toLowerCase().includes(n) && !(r.npwp ?? "").toLowerCase().includes(n)) return false;
      }
      return true;
    });
  }, [list.data, q, type]);

  const cols: Column<WithholdingTaxEntry>[] = [
    { key: "name", header: "No.", cell: (r) => <span className="font-mono text-xs">{r.name}</span>, width: "180px" },
    { key: "posting_date", header: "Tanggal", cell: (r) => formatTanggal(r.posting_date) },
    { key: "tax_type", header: "Jenis", cell: (r) => <Badge tone="brand">{r.tax_type}</Badge> },
    { key: "party", header: "Pihak", cell: (r) => <span className="text-xs">{r.party_type ? `${r.party_type}/${r.party}` : "—"}</span> },
    { key: "npwp", header: "NPWP", cell: (r) => <span className="text-xs font-mono">{r.npwp ?? "—"}</span> },
    { key: "base", header: "Base", cell: (r) => formatRupiah(r.base_amount ?? 0), align: "right" },
    { key: "rate", header: "Rate", cell: (r) => `${r.tax_rate ?? 0}%`, align: "right" },
    { key: "amt", header: "Tax", cell: (r) => formatRupiah(r.tax_amount ?? 0), align: "right" },
    { key: "status", header: "Status", cell: (r) => { const b = whtStatusBadge(r.status); return <Badge tone={b.tone}>{b.label}</Badge>; }, align: "center" },
  ];

  const computedTax = (form.base_amount ?? 0) * (form.tax_rate ?? 0) / 100;

  const handleCreate = async (submit: boolean) => {
    setBusy(true); setErr(null);
    try {
      const doc = await create.mutateAsync({
        ...form,
        company,
        tax_amount: computedTax,
      } as Record<string, unknown>);
      if (submit) await submitDoc(DOCTYPE.WITHHOLDING_TAX_ENTRY, doc.name);
      await list.refetch();
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan WHT.");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Withholding Tax Entry" description="Posting PPh 21/22/23/4(2) yang dipotong." actions={<Button onClick={() => { setErr(null); setOpen(true); }}>+ Entry Baru</Button>} />
      <FilterBar
        search={{ value: q, placeholder: "Cari nomor / pihak / NPWP…", onChange: setQ }}
        filters={[
          {
            key: "type", label: "Jenis", value: type,
            options: [{ value: ALL, label: ALL }, ...WHT_TAX_TYPES.map((v) => ({ value: v, label: v }))],
            onChange: setType,
          },
        ]}
      />
      <SectionCard padded={false}>
        <DataTable<WithholdingTaxEntry>
          data={rows} columns={cols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada entry."}</div>}
        />
      </SectionCard>

      <Modal open={open} onClose={() => setOpen(false)} title="Withholding Tax Entry Baru" size="lg">
        {err && <Alert tone="danger" title="Error">{err}</Alert>}
        <FormGrid cols={3}>
          <FormField label="Tax Type" required>
            <Select value={form.tax_type ?? "PPh23"} onChange={(e) => setForm({ ...form, tax_type: e.target.value as WhtTaxType })}>
              {WHT_TAX_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </FormField>
          <FormField label="Posting Date" required>
            <Input type="date" value={form.posting_date ?? ""} onChange={(e) => setForm({ ...form, posting_date: e.target.value })} />
          </FormField>
          <FormField label="Company" hint="Auto: company sekolah aktif">
            <Input value={company} disabled />
          </FormField>
          <FormField label="Party Type">
            <Select value={form.party_type ?? ""} onChange={(e) => {
              const v = e.target.value as "Customer" | "Supplier" | "";
              setForm((prev) => {
                const next = { ...prev };
                if (v) next.party_type = v;
                else delete next.party_type;
                return next;
              });
            }}>
              <option value="">—</option>
              <option value="Customer">Customer</option>
              <option value="Supplier">Supplier</option>
            </Select>
          </FormField>
          <FormField label="Party">
            <Input value={form.party ?? ""} onChange={(e) => setForm({ ...form, party: e.target.value })} />
          </FormField>
          <FormField label="NPWP">
            <Input value={form.npwp ?? ""} onChange={(e) => setForm({ ...form, npwp: e.target.value })} placeholder="00.000.000.0-000.000" />
          </FormField>
          <FormField label="Base Amount (IDR)" required>
            <Input type="number" value={form.base_amount || ""} onChange={(e) => setForm({ ...form, base_amount: Number(e.target.value) || 0 })} />
          </FormField>
          <FormField label="Tax Rate (%)" required>
            <Input type="number" value={form.tax_rate || ""} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) || 0 })} />
          </FormField>
          <FormField label="Tax Amount (auto)">
            <Input value={formatRupiah(computedTax)} disabled />
          </FormField>
        </FormGrid>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
          <Button variant="outline" onClick={() => handleCreate(false)} disabled={busy}>Simpan Draft</Button>
          <Button onClick={() => handleCreate(true)} disabled={busy}>{busy ? "Memproses…" : "Simpan & Submit"}</Button>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/pajak/withholding")({ component: WithholdingPage });
