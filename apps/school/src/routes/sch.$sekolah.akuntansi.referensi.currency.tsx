/**
 * Currency Exchange reference list — Keuangan hub.
 *
 * Records daily foreign-exchange rates used to translate valas transactions.
 * Presentation-only redesign: adds a concise page guide and a currency-pair
 * distribution visualization computed from the already fetched list. All data
 * wiring (useResourceList/Create, DOCTYPE, order_by) and the modal create logic
 * are preserved verbatim.
 */
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
import { KeuanganPageGuide } from "../components/keuangan";
import { DistributionBar, type DistributionSegment, type Tone } from "../components/viz";

/** Rotating palette for currency-pair distribution segments. */
const PAIR_TONES: readonly Tone[] = ["brand", "emerald", "amber", "violet", "sky", "rose"];

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

  // Distribusi jumlah entri per pasangan mata uang, dari data yang sudah diambil (read-only).
  const pairDist = useMemo<DistributionSegment[]>(() => {
    const all = list.data ?? [];
    const counts = new Map<string, number>();
    for (const r of all) {
      const pair = `${r.from_currency ?? "?"}→${r.to_currency ?? "?"}`;
      counts.set(pair, (counts.get(pair) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, value], i) => ({
      label,
      value,
      tone: PAIR_TONES[i % PAIR_TONES.length] ?? "neutral",
    }));
  }, [list.data]);

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

      <KeuanganPageGuide
        storageId="referensi-currency"
        intro="Currency Exchange menyimpan nilai tukar harian. Kurs dipakai untuk menerjemahkan transaksi mata uang asing (valas) ke mata uang dasar perusahaan."
        steps={[
          { title: "Tambah kurs", detail: "Klik + Kurs, pilih tanggal berlaku, masukkan From Currency (mis. USD), To Currency (mis. IDR), dan exchange rate-nya." },
          { title: "Perbarui per tanggal", detail: "Isi entri baru setiap hari/transaksi penting agar nilai tukar yang dipakai selalu akurat — entri lama tetap tersimpan sebagai riwayat." },
          { title: "Cari pasangan mata uang", detail: "Gunakan kotak pencarian untuk menyaring berdasarkan mata uang asal atau tujuan." },
        ]}
        tips={["Cukup isi halaman ini bila sekolah punya transaksi valas; jika seluruh transaksi dalam IDR, kurs tidak diperlukan."]}
      />

      {pairDist.length > 0 && (
        <SectionCard title="Distribusi Entri per Pasangan Mata Uang">
          <DistributionBar segments={pairDist} />
        </SectionCard>
      )}

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
