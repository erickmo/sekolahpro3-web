/**
 * Daftar SPT Masa PPN (pelaporan PPN bulanan).
 *
 * Presentation-only redesign: adds a workflow guide, a status-distribution bar,
 * and glossary tooltips. The list query, create mutation, columns, and submit
 * flow are unchanged.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
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
  formatRupiah,
  sptStatusBadge,
  submitDoc,
  type SptMasaPPN,
} from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";
import { KeuanganPageGuide } from "../components/keuangan";
import { DistributionBar, type DistributionSegment } from "../components/viz";
import { defOf } from "../lib/glossary";

function SptPpnPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [taxPeriod, setTaxPeriod] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const company = useActiveCompany();

  const list = useResourceList<SptMasaPPN>(DOCTYPE.SPT_MASA_PPN, {
    fields: ["name", "tax_period", "company", "status", "ppn_keluaran", "ppn_masukan", "ppn_kurang_bayar", "docstatus"],
    filters: withCompanyFilter(undefined, company),
    order_by: "creation desc",
    limit_page_length: 200,
  });
  const create = useResourceCreate<SptMasaPPN>(DOCTYPE.SPT_MASA_PPN);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.name.toLowerCase().includes(n) || r.tax_period?.toLowerCase().includes(n));
  }, [list.data, q]);

  // Distribusi status SPT (Draft / Filed) untuk visualisasi ringkas.
  const statusDist = useMemo<DistributionSegment[]>(() => {
    const all = list.data ?? [];
    const filed = all.filter((r) => r.status === "Filed").length;
    return [
      { label: "Draft", value: all.length - filed, tone: "amber" },
      { label: "Filed", value: filed, tone: "emerald" },
    ];
  }, [list.data]);
  const hasSpt = (list.data ?? []).length > 0;

  const cols: Column<SptMasaPPN>[] = [
    { key: "name", header: "No.", cell: (r) => (
      <Link to="/sch/$sekolah/akuntansi/pajak/spt-ppn/$name" params={{ sekolah, name: r.name }} className="font-mono text-xs text-brand hover:underline">{r.name}</Link>
    ), width: "180px" },
    { key: "tax_period", header: "Tax Period", cell: (r) => r.tax_period },
    { key: "company", header: "Company", cell: (r) => <span className="text-xs">{r.company}</span> },
    { key: "ppn_keluaran", header: "PPN Keluaran", cell: (r) => formatRupiah(r.ppn_keluaran ?? 0), align: "right" },
    { key: "ppn_masukan", header: "PPN Masukan", cell: (r) => formatRupiah(r.ppn_masukan ?? 0), align: "right" },
    { key: "ppn_kurang_bayar", header: "Kurang Bayar", cell: (r) => formatRupiah(r.ppn_kurang_bayar ?? 0), align: "right" },
    { key: "status", header: "Status", cell: (r) => { const b = sptStatusBadge(r.status); return <Badge tone={b.tone}>{b.label}</Badge>; }, align: "center" },
  ];

  const handleCreate = async (submit: boolean) => {
    setBusy(true); setErr(null);
    try {
      const doc = await create.mutateAsync({ tax_period: taxPeriod, company } as Record<string, unknown>);
      if (submit) await submitDoc(DOCTYPE.SPT_MASA_PPN, doc.name);
      await list.refetch();
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal membuat SPT.");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="SPT Masa PPN"
        description={<>Pelaporan <GlossaryTooltip term="PPN" definition={defOf("PPN") ?? "Pajak Pertambahan Nilai."} /> bulanan (<GlossaryTooltip term="SPT" definition={defOf("SPT") ?? "Surat Pemberitahuan masa pelaporan pajak."} />).</>}
        actions={<Button onClick={() => { setTaxPeriod(""); setErr(null); setOpen(true); }}>+ SPT Baru</Button>}
      />
      <KeuanganPageGuide
        storageId="spt-ppn-list"
        intro="Susun SPT Masa PPN tiap bulan: sistem menghitung PPN keluaran dikurangi PPN masukan menjadi kurang/lebih bayar."
        steps={[
          { title: "Buat SPT baru", detail: "Klik + SPT Baru, isi Tax Period (mis. PPN-2026-01), lalu simpan draft atau langsung submit." },
          { title: "Tinjau perhitungan", detail: "Buka nomor SPT untuk melihat PPN keluaran, masukan, dan kurang bayar." },
          { title: "Submit & lapor", detail: "Setelah dicek, submit SPT lalu lapor ke DJP sebelum jatuh tempo." },
        ]}
        tips={["Pastikan e-Faktur periode tersebut sudah selesai sebelum menyusun SPT."]}
      />
      {hasSpt ? (
        <SectionCard title="Distribusi Status SPT" description="Sebaran SPT menurut tahap pelaporan.">
          <DistributionBar segments={statusDist} />
        </SectionCard>
      ) : null}
      <FilterBar search={{ value: q, placeholder: "Cari…", onChange: setQ }} />
      <SectionCard padded={false}>
        <DataTable<SptMasaPPN>
          data={rows} columns={cols} rowKey={(r) => r.name}
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Belum ada SPT."}</div>}
        />
      </SectionCard>

      <Modal open={open} onClose={() => setOpen(false)} title="SPT Masa PPN Baru">
        {err && <Alert tone="danger" title="Error">{err}</Alert>}
        <FormGrid cols={2}>
          <FormField label="Tax Period" required>
            <Input value={taxPeriod} onChange={(e) => setTaxPeriod(e.target.value)} placeholder="contoh: PPN-2026-01" />
          </FormField>
          <FormField label="Company" hint="Auto: company sekolah aktif">
            <Input value={company} disabled />
          </FormField>
        </FormGrid>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
          <Button variant="outline" onClick={() => handleCreate(false)} disabled={busy || !taxPeriod || !company}>Simpan Draft</Button>
          <Button onClick={() => handleCreate(true)} disabled={busy || !taxPeriod || !company}>{busy ? "Memproses…" : "Simpan & Submit"}</Button>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/pajak/spt-ppn/")({ component: SptPpnPage });
