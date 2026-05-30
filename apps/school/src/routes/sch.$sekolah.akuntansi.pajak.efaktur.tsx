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
  type Column,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  efakturStatusBadge,
  formatTanggal,
  type EfakturExport,
} from "../data/akuntansi";

function EfakturPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ tax_period: string; export_date: string; nsfp_from: string; nsfp_to: string }>({
    tax_period: "", export_date: new Date().toISOString().slice(0, 10), nsfp_from: "", nsfp_to: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const list = useResourceList<EfakturExport>(DOCTYPE.EFAKTUR_EXPORT, {
    fields: ["name", "tax_period", "export_date", "status", "format", "nsfp_from", "nsfp_to"],
    order_by: "creation desc",
    limit_page_length: 200,
  });
  const create = useResourceCreate<EfakturExport>(DOCTYPE.EFAKTUR_EXPORT);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.name.toLowerCase().includes(n) || r.tax_period?.toLowerCase().includes(n));
  }, [list.data, q]);

  const cols: Column<EfakturExport>[] = [
    { key: "name", header: "No.", cell: (r) => <span className="font-mono text-xs">{r.name}</span>, width: "180px" },
    { key: "tax_period", header: "Tax Period", cell: (r) => r.tax_period },
    { key: "export_date", header: "Export Date", cell: (r) => formatTanggal(r.export_date) },
    { key: "nsfp", header: "NSFP", cell: (r) => <span className="text-xs">{r.nsfp_from ?? "—"} → {r.nsfp_to ?? "—"}</span> },
    { key: "format", header: "Format", cell: (r) => r.format ?? "—" },
    { key: "status", header: "Status", cell: (r) => { const b = efakturStatusBadge(r.status); return <Badge tone={b.tone}>{b.label}</Badge>; }, align: "center" },
  ];

  const handleCreate = async () => {
    setBusy(true); setErr(null);
    try {
      await create.mutateAsync({
        tax_period: form.tax_period,
        export_date: form.export_date,
        nsfp_from: form.nsfp_from || undefined,
        nsfp_to: form.nsfp_to || undefined,
        format: "Coretax XML",
      } as Record<string, unknown>);
      await list.refetch();
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal membuat e-Faktur.");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="e-Faktur Export" description="Generate Coretax XML untuk submit ke DJP." actions={<Button onClick={() => { setErr(null); setOpen(true); }}>+ Export Baru</Button>} />
      <FilterBar search={{ value: q, placeholder: "Cari…", onChange: setQ }} />
      <SectionCard padded={false}>
        <DataTable<EfakturExport>
          data={rows} columns={cols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada export."}</div>}
        />
      </SectionCard>

      <Modal open={open} onClose={() => setOpen(false)} title="e-Faktur Export Baru">
        {err && <Alert tone="danger" title="Error">{err}</Alert>}
        <FormGrid cols={2}>
          <FormField label="Tax Period" required>
            <Input value={form.tax_period} onChange={(e) => setForm({ ...form, tax_period: e.target.value })} />
          </FormField>
          <FormField label="Export Date" required>
            <Input type="date" value={form.export_date} onChange={(e) => setForm({ ...form, export_date: e.target.value })} />
          </FormField>
          <FormField label="NSFP From">
            <Input value={form.nsfp_from} onChange={(e) => setForm({ ...form, nsfp_from: e.target.value })} placeholder="000-00.00000000" />
          </FormField>
          <FormField label="NSFP To">
            <Input value={form.nsfp_to} onChange={(e) => setForm({ ...form, nsfp_to: e.target.value })} placeholder="000-00.99999999" />
          </FormField>
        </FormGrid>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
          <Button onClick={handleCreate} disabled={busy || !form.tax_period}>{busy ? "Memproses…" : "Buat Export"}</Button>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/pajak/efaktur")({ component: EfakturPage });
