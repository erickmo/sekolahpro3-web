import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  PageHeader,
  SectionCard,
  StatCard,
  IconChart,
  IconFile,
  IconWallet,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  formatRupiah,
  type EfakturExport,
  type SptMasaPPN,
  type WithholdingTaxEntry,
} from "../data/akuntansi";
import { scopedLinkProps } from "../lib/scoped";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";

function PajakOverview() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const company = useActiveCompany();
  const sptQ = useResourceList<SptMasaPPN>(DOCTYPE.SPT_MASA_PPN, { fields: ["name", "status", "ppn_kurang_bayar"], filters: withCompanyFilter(undefined, company), limit_page_length: 0 });
  const efQ = useResourceList<EfakturExport>(DOCTYPE.EFAKTUR_EXPORT, { fields: ["name", "status"], limit_page_length: 0 });
  const whtQ = useResourceList<WithholdingTaxEntry>(DOCTYPE.WITHHOLDING_TAX_ENTRY, { fields: ["name", "status", "tax_amount"], filters: withCompanyFilter(undefined, company), limit_page_length: 0 });

  const sptDraft = (sptQ.data ?? []).filter((s) => (s.status ?? "Draft") === "Draft").length;
  const sptKurang = (sptQ.data ?? []).reduce((a, s) => a + (s.ppn_kurang_bayar ?? 0), 0);
  const efExported = (efQ.data ?? []).filter((e) => e.status === "Exported" || e.status === "Submitted").length;
  const whtTotal = (whtQ.data ?? []).reduce((a, w) => a + (w.tax_amount ?? 0), 0);

  const tile = (label: string, hint: string, path: string) => (
    <Link {...scopedLinkProps(sekolah, path)} className="rounded-md border border-border p-3 hover:bg-muted/60">
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-muted-fg">{hint}</div>
    </Link>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Pajak Indonesia" description="PPN, PPh 21/22/23/4(2), e-Faktur, SPT Masa." />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="SPT Draft" value={String(sptDraft)} hint="Belum filed" icon={<IconFile />} accent="amber" />
        <StatCard label="PPN Kurang Bayar" value={formatRupiah(sptKurang)} hint="Akumulasi" icon={<IconChart />} accent="rose" />
        <StatCard label="e-Faktur Exported" value={String(efExported)} hint="Coretax XML" icon={<IconFile />} accent="emerald" />
        <StatCard label="Withholding Total" value={formatRupiah(whtTotal)} hint="PPh dipotong" icon={<IconWallet />} accent="brand" />
      </div>
      <SectionCard title="Aksi Cepat">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tile("Buka SPT Masa PPN", "Pelaporan PPN bulanan", "/akuntansi/pajak/spt-ppn")}
          {tile("Generate e-Faktur", "Export Coretax XML", "/akuntansi/pajak/efaktur")}
          {tile("Withholding Tax Entry", "PPh 21/22/23/4(2)", "/akuntansi/pajak/withholding")}
          {tile("Tarif TER & 4(2)", "Referensi PMK 168/2023", "/akuntansi/pajak/ter")}
        </div>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/pajak/")({ component: PajakOverview });
