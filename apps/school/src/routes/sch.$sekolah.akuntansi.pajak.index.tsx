/**
 * Dashboard ringkasan modul Pajak Indonesia (PPN, PPh, e-Faktur, SPT Masa).
 *
 * Presentation-only redesign: adds a role-aware page guide, role chips, and a
 * composition donut over the SAME data the overview already fetches. Data hooks,
 * doctypes, filters, and totals are untouched.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  PageHeader,
  SectionCard,
  StatCard,
  GlossaryTooltip,
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
import { useActiveCompany, withCompanyFilter, efakturScopeFilter } from "../lib/akuntansi-scope";
import { KeuanganPageGuide, KeuanganRoleChips } from "../components/keuangan";
import { useKeuanganRole, type KeuanganRole } from "../lib/keuanganRole";
import { DonutChart, type ChartDatum } from "../components/viz";
import { defOf } from "../lib/glossary";

function PajakOverview() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const company = useActiveCompany();
  const roleInfo = useKeuanganRole();
  const [activeRole, setActiveRole] = useState<KeuanganRole>(roleInfo.primary);
  const sptQ = useResourceList<SptMasaPPN>(DOCTYPE.SPT_MASA_PPN, { fields: ["name", "status", "ppn_kurang_bayar"], filters: withCompanyFilter(undefined, company), limit_page_length: 0 });
  // e-Faktur Export has no `company` field — scope it via the company's Tax
  // Periods so the overview count never mixes in another school's exports.
  const periodsQ = useResourceList<{ name: string }>(DOCTYPE.TAX_PERIOD, { fields: ["name"], filters: withCompanyFilter(undefined, company), limit_page_length: 0 });
  const periodNames = useMemo(() => (periodsQ.data ?? []).map((p) => p.name), [periodsQ.data]);
  const efQ = useResourceList<EfakturExport>(DOCTYPE.EFAKTUR_EXPORT, { fields: ["name", "status"], filters: efakturScopeFilter(company, periodNames), limit_page_length: 0 }, { enabled: !company || !periodsQ.isLoading });
  const whtQ = useResourceList<WithholdingTaxEntry>(DOCTYPE.WITHHOLDING_TAX_ENTRY, { fields: ["name", "status", "tax_amount"], filters: withCompanyFilter(undefined, company), limit_page_length: 0 });

  const sptDraft = (sptQ.data ?? []).filter((s) => (s.status ?? "Draft") === "Draft").length;
  const sptKurang = (sptQ.data ?? []).reduce((a, s) => a + (s.ppn_kurang_bayar ?? 0), 0);
  const efExported = (efQ.data ?? []).filter((e) => e.status === "Exported" || e.status === "Submitted").length;
  const whtTotal = (whtQ.data ?? []).reduce((a, w) => a + (w.tax_amount ?? 0), 0);

  // Composition of outstanding tax exposure (PPN kurang bayar vs PPh dipotong).
  const composition: ChartDatum[] = [
    { label: "PPN Kurang Bayar", value: Math.max(0, Math.round(sptKurang)), tone: "rose" },
    { label: "PPh Dipotong", value: Math.max(0, Math.round(whtTotal)), tone: "brand" },
  ];
  const compositionTotal = composition.reduce((a, d) => a + d.value, 0);

  const tile = (label: string, hint: string, path: string) => (
    <Link {...scopedLinkProps(sekolah, path)} className="rounded-md border border-border p-3 hover:bg-muted/60">
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-muted-fg">{hint}</div>
    </Link>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pajak Indonesia"
        description={
          <>
            <GlossaryTooltip term="PPN" definition={defOf("PPN") ?? "Pajak Pertambahan Nilai atas penyerahan barang/jasa kena pajak."} />, PPh 21/22/23/4(2),{" "}
            <GlossaryTooltip term="e-Faktur" definition={defOf("e-Faktur") ?? "Faktur pajak elektronik yang diunggah ke sistem DJP."} />, dan{" "}
            <GlossaryTooltip term="SPT" definition={defOf("SPT") ?? "Surat Pemberitahuan masa/tahunan pelaporan pajak."} /> Masa.
          </>
        }
      />
      <KeuanganPageGuide
        storageId="pajak-overview"
        intro="Pusat kepatuhan pajak sekolah: rekam PPN keluaran/masukan, potong PPh, hasilkan e-Faktur, dan laporkan SPT Masa tepat waktu."
        steps={[
          { title: "Pantau eksposur pajak", detail: "Kartu di atas merangkum SPT draft, PPN kurang bayar, e-Faktur terkirim, dan total PPh dipotong.", roles: ["kepala", "bendahara"] },
          { title: "Catat potongan PPh", detail: "Posting Withholding Tax Entry untuk PPh 21/22/23/4(2) atas pembayaran ke vendor/pegawai.", roles: ["akuntan"] },
          { title: "Hasilkan e-Faktur & SPT", detail: "Export Coretax XML lalu susun SPT Masa PPN sebelum batas lapor bulanan.", roles: ["akuntan", "bendahara"] },
        ]}
        tips={["Selesaikan SPT draft sebelum tanggal jatuh tempo agar tidak kena sanksi.", "Cocokkan PPN kurang bayar dengan kas yang harus disetor ke kas negara."]}
      />
      <KeuanganRoleChips active={activeRole} onSelect={setActiveRole} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="SPT Draft" value={String(sptDraft)} hint="Belum filed" icon={<IconFile />} accent="amber" />
        <StatCard label="PPN Kurang Bayar" value={formatRupiah(sptKurang)} hint="Akumulasi" icon={<IconChart />} accent="rose" />
        <StatCard label="e-Faktur Exported" value={String(efExported)} hint="Coretax XML" icon={<IconFile />} accent="emerald" />
        <StatCard label="Withholding Total" value={formatRupiah(whtTotal)} hint="PPh dipotong" icon={<IconWallet />} accent="brand" />
      </div>
      {compositionTotal > 0 ? (
        <SectionCard title="Komposisi Eksposur Pajak" description="Perbandingan PPN kurang bayar dan PPh yang telah dipotong.">
          <div className="flex justify-center">
            <DonutChart
              data={composition}
              centerTop="Total"
              centerBottom={formatRupiah(compositionTotal)}
            />
          </div>
        </SectionCard>
      ) : null}
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
