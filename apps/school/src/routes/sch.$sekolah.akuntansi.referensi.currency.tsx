import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  DataTable,
  FilterBar,
  FormField,
  FormGrid,
  Input,
  Modal,
  PageHeader,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { DOCTYPE, formatTanggal, type CurrencyExchange } from "../data/akuntansi";

function CurrencyPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<CurrencyExchange>>({ date: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);

  const list = useResourceList<CurrencyExchange>(DOCTYPE.CURRENCY_EXCHANGE, {
    fields: ["name", "date", "from_currency", "to_currency", "exchange_rate"],
    order_by: "date desc",
    limit_page_length: 200,
  });
  const create = useResourceCreate<CurrencyExchange>(DOCTYPE.CURRENCY_EXCHANGE);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.from_currency?.toLowerCase().includes(n) || r.to_currency?.toLowerCase().includes(n));
  }, [list.data, q]);

  const cols: Column<CurrencyExchange>[] = [
    { key: "date", header: "Tanggal", cell: (r) => formatTanggal(r.date) },
    { key: "from", header: "From", cell: (r) => r.from_currency },
    { key: "to", header: "To", cell: (r) => r.to_currency },
    { key: "rate", header: "Rate", cell: (r) => r.exchange_rate.toFixed(4), align: "right" },
  ];

  const handleSave = async () => {
    setBusy(true);
    try {
      await create.mutateAsync(form as Record<string, unknown>);
      await list.refetch();
      setOpen(false);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Currency Exchange" description="Kurs valas harian." actions={<Button onClick={() => { setForm({ date: new Date().toISOString().slice(0, 10) }); setOpen(true); }}>+ Kurs</Button>} />
      <FilterBar search={{ value: q, placeholder: "Cari mata uang…", onChange: setQ }} />
      <SectionCard padded={false}>
        <DataTable<CurrencyExchange>
          data={rows} columns={cols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada kurs."}</div>}
        />
      </SectionCard>
      <Modal open={open} onClose={() => setOpen(false)} title="Kurs Baru">
        <FormGrid cols={2}>
          <FormField label="Tanggal" required>
            <Input type="date" value={form.date ?? ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </FormField>
          <FormField label="Exchange Rate" required>
            <Input type="number" step="0.0001" value={form.exchange_rate ?? ""} onChange={(e) => setForm({ ...form, exchange_rate: Number(e.target.value) || 0 })} />
          </FormField>
          <FormField label="From Currency" required>
            <Input value={form.from_currency ?? ""} onChange={(e) => setForm({ ...form, from_currency: e.target.value })} placeholder="USD" />
          </FormField>
          <FormField label="To Currency" required>
            <Input value={form.to_currency ?? ""} onChange={(e) => setForm({ ...form, to_currency: e.target.value })} placeholder="IDR" />
          </FormField>
        </FormGrid>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
          <Button onClick={handleSave} disabled={busy || !form.date || !form.from_currency || !form.to_currency || !form.exchange_rate}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/referensi/currency")({ component: CurrencyPage });
