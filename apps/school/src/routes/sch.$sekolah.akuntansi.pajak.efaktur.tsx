/**
 * Daftar e-Faktur Export (generate Coretax XML untuk DJP).
 *
 * Presentation-only redesign: adds a workflow guide, a status-distribution bar,
 * and glossary tooltips on tax jargon. List query, create mutation, columns, and
 * the export form are unchanged.
 */
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
  GlossaryTooltip,
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
import { KeuanganPageGuide } from "../components/keuangan";
import { DistributionBar, type DistributionSegment } from "../components/viz";
import { defOf } from "../lib/glossary";
import { useActiveCompany, withCompanyFilter, efakturScopeFilter } from "../lib/akuntansi-scope";

function EfakturPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ tax_period: string; export_date: string; nsfp_from: string; nsfp_to: string }>({
    tax_period: "", export_date: new Date().toISOString().slice(0, 10), nsfp_from: "", nsfp_to: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // e-Faktur Export has no `company` field; scope it via the active company's
  // Tax Periods (Tax Period IS company-scoped) so the list never shows another
  // school's exports. Wait for the periods to load before firing the list.
  const company = useActiveCompany();
  const periodsQ = useResourceList<{ name: string }>(DOCTYPE.TAX_PERIOD, {
    fields: ["name"],
    filters: withCompanyFilter(undefined, company),
    limit_page_length: 0,
  });
  const periodNames = useMemo(() => (periodsQ.data ?? []).map((p) => p.name), [periodsQ.data]);

  const list = useResourceList<EfakturExport>(
    DOCTYPE.EFAKTUR_EXPORT,
    {
      fields: ["name", "tax_period", "export_date", "status", "format", "nsfp_from", "nsfp_to"],
      filters: efakturScopeFilter(company, periodNames),
      order_by: "creation desc",
      limit_page_length: 200,
    },
    { enabled: !company || !periodsQ.isLoading },
  );
  const create = useResourceCreate<EfakturExport>(DOCTYPE.EFAKTUR_EXPORT);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.name.toLowerCase().includes(n) || r.tax_period?.toLowerCase().includes(n));
  }, [list.data, q]);

  // Distribusi status export untuk visualisasi ringkas di atas tabel.
  const statusDist = useMemo<DistributionSegment[]>(() => {
    const all = list.data ?? [];
    const exported = all.filter((r) => r.status === "Exported").length;
    const submitted = all.filter((r) => r.status === "Submitted").length;
    const draft = all.length - exported - submitted;
    return [
      { label: "Draft", value: Math.max(0, draft), tone: "amber" },
      { label: "Exported", value: exported, tone: "sky" },
      { label: "Submitted", value: submitted, tone: "emerald" },
    ];
  }, [list.data]);
  const hasExport = (list.data ?? []).length > 0;

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
      <PageHeader
        title="e-Faktur Export"
        description={<>Generate <GlossaryTooltip term="Coretax" definition={defOf("Coretax") ?? "Sistem inti administrasi perpajakan DJP terbaru."} /> XML untuk submit ke DJP.</>}
        actions={<Button onClick={() => { setErr(null); setOpen(true); }}>+ Export Baru</Button>}
      />
      <KeuanganPageGuide
        storageId="efaktur-list"
        intro={<>Hasilkan berkas Coretax XML dari rentang <GlossaryTooltip term="NSFP" definition={defOf("NSFP") ?? "Nomor Seri Faktur Pajak yang dijatah DJP untuk penomoran faktur pajak."} /> untuk diunggah ke aplikasi e-Faktur/Coretax DJP.</>}
        steps={[
          { title: "Buat export", detail: "Klik + Export Baru, isi Tax Period, tanggal export, dan rentang NSFP." },
          { title: "Unduh & unggah", detail: "Export menghasilkan format Coretax XML siap diunggah ke sistem DJP." },
          { title: "Tandai submitted", detail: "Setelah berkas diterima DJP, status berpindah dari Exported ke Submitted." },
        ]}
        tips={["Pastikan rentang NSFP tidak tumpang tindih dengan export periode lain."]}
      />
      {hasExport ? (
        <SectionCard title="Distribusi Status Export" description="Sebaran export menurut tahap pengiriman.">
          <DistributionBar segments={statusDist} />
        </SectionCard>
      ) : null}
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
