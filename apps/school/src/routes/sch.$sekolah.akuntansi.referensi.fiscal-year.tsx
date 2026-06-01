/**
 * Fiscal Year reference list — Keuangan hub.
 *
 * Manages the company fiscal years that frame every accounting period and
 * budget. Presentation-only redesign: adds a concise page guide and an
 * Open/Closed status-distribution visualization computed from the already
 * fetched list. All data wiring (useResourceList/Create/Update, DOCTYPE,
 * filters, order_by) and the modal CRUD logic are preserved verbatim.
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
  type Column,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList, useResourceUpdate } from "@sekolahpro/api-client";
import { DOCTYPE, formatTanggal, type FiscalYear } from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";
import { KeuanganPageGuide } from "../components/keuangan";
import { DistributionBar, type DistributionSegment } from "../components/viz";

function FiscalYearPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FiscalYear | null>(null);
  const [form, setForm] = useState<Partial<FiscalYear>>({});
  const [busy, setBusy] = useState(false);
  const company = useActiveCompany();

  const list = useResourceList<FiscalYear>(DOCTYPE.FISCAL_YEAR, {
    fields: ["name", "year_name", "year_start_date", "year_end_date", "is_closed", "company"],
    filters: withCompanyFilter(undefined, company),
    order_by: "year_start_date desc",
    limit_page_length: 200,
  });
  const create = useResourceCreate<FiscalYear>(DOCTYPE.FISCAL_YEAR);
  const update = useResourceUpdate<FiscalYear>(DOCTYPE.FISCAL_YEAR);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.year_name?.toLowerCase().includes(n));
  }, [list.data, q]);

  // Distribusi status Open/Closed dihitung dari data yang sudah diambil (read-only).
  const statusDist = useMemo<DistributionSegment[]>(() => {
    const all = list.data ?? [];
    let open = 0;
    let closed = 0;
    for (const r of all) {
      if (r.is_closed) closed += 1;
      else open += 1;
    }
    const segments: DistributionSegment[] = [];
    if (open > 0) segments.push({ label: "Open", value: open, tone: "emerald" });
    if (closed > 0) segments.push({ label: "Closed", value: closed, tone: "rose" });
    return segments;
  }, [list.data]);

  const cols: Column<FiscalYear>[] = [
    { key: "year_name", header: "Nama", cell: (r) => r.year_name },
    { key: "start", header: "Mulai", cell: (r) => formatTanggal(r.year_start_date) },
    { key: "end", header: "Selesai", cell: (r) => formatTanggal(r.year_end_date) },
    { key: "company", header: "Company", cell: (r) => r.company ?? "—" },
    { key: "is_closed", header: "Status", cell: (r) => r.is_closed ? <Badge tone="danger">Closed</Badge> : <Badge tone="success">Open</Badge>, align: "center" },
  ];

  const openModal = (r: FiscalYear | null) => { setEditing(r); setForm(r ?? {}); setOpen(true); };
  const handleSave = async () => {
    setBusy(true);
    try {
      const doc: Record<string, unknown> = {
        year_name: form.year_name,
        year_start_date: form.year_start_date,
        year_end_date: form.year_end_date,
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
      <PageHeader title="Fiscal Year" description="Tahun fiskal." actions={<Button onClick={() => openModal(null)}>+ Fiscal Year</Button>} />

      <KeuanganPageGuide
        storageId="referensi-fiscal-year"
        intro="Fiscal Year adalah kerangka tahun anggaran perusahaan. Setiap periode akuntansi, jurnal, dan budget mengacu pada tahun fiskal ini."
        steps={[
          { title: "Buat tahun fiskal", detail: "Klik + Fiscal Year, isi nama (mis. 2026) beserta tanggal mulai dan selesai. Company terisi otomatis dari sekolah aktif." },
          { title: "Atur status", detail: "Biarkan Open selama tahun berjalan. Ubah ke Closed setelah tutup buku agar transaksi tahun itu tidak berubah lagi." },
          { title: "Edit lewat baris tabel", detail: "Klik salah satu baris untuk membuka kembali dan memperbarui datanya." },
        ]}
        tips={["Satu tahun fiskal biasanya berdurasi 12 bulan dan tidak boleh tumpang tindih dengan tahun lain."]}
      />

      {statusDist.length > 0 && (
        <SectionCard title="Distribusi Status Tahun Fiskal">
          <DistributionBar segments={statusDist} />
        </SectionCard>
      )}

      <FilterBar search={{ value: q, placeholder: "Cari…", onChange: setQ }} />
      <SectionCard padded={false}>
        <DataTable<FiscalYear>
          data={rows} columns={cols} rowKey={(r) => r.name}
          onRowClick={openModal}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada fiscal year."}</div>}
        />
      </SectionCard>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.year_name}` : "Fiscal Year Baru"}>
        <FormGrid cols={2}>
          <FormField label="Year Name" required>
            <Input value={form.year_name ?? ""} onChange={(e) => setForm({ ...form, year_name: e.target.value })} placeholder="2026" />
          </FormField>
          <FormField label="Company" hint="Auto: company sekolah aktif">
            <Input value={form.company ?? company} disabled />
          </FormField>
          <FormField label="Start Date" required>
            <Input type="date" value={form.year_start_date ?? ""} onChange={(e) => setForm({ ...form, year_start_date: e.target.value })} />
          </FormField>
          <FormField label="End Date" required>
            <Input type="date" value={form.year_end_date ?? ""} onChange={(e) => setForm({ ...form, year_end_date: e.target.value })} />
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
          <Button onClick={handleSave} disabled={busy || !form.year_name || !form.year_start_date || !form.year_end_date}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/referensi/fiscal-year")({ component: FiscalYearPage });
