/**
 * Akuntansi dashboard — accounting command center inside the Keuangan hub.
 *
 * Role-aware (Akuntan / Kepala), visual: account composition donut, posting
 * health, setup completeness ring, plus quick-link grids to every sub-module.
 * Preserves the vernon_accounting Frappe wiring (useResourceList + company scope).
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { scopedLinkProps } from "../lib/scoped";
import { useActiveCompany } from "../lib/akuntansi-scope";
import {
  Badge,
  PageHeader,
  SectionCard,
  StatCard,
  IconChart,
  IconFile,
  IconWallet,
  IconPlus,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { DonutChart, ProgressRing, type ChartDatum, type Tone } from "../components/viz";
import { KeuanganRoleChips, KeuanganPageGuide, LinkGrid, type QuickLink } from "../components/keuangan";
import { useKeuanganRole, type KeuanganRole } from "../lib/keuanganRole";
import {
  DOCTYPE,
  formatRupiah,
  type Account,
  type Budget,
  type JournalEntry,
  type PaymentEntry,
  type SptMasaPPN,
  type FiscalYear,
} from "../data/akuntansi";

const BUKU_BESAR_LINKS: readonly QuickLink[] = [
  { to: "/sch/$sekolah/akuntansi/buku-besar/akun", label: "Bagan Akun", hint: "Chart of Accounts" },
  { to: "/sch/$sekolah/akuntansi/buku-besar/jurnal", label: "Jurnal Umum", hint: "Posting manual" },
  { to: "/sch/$sekolah/akuntansi/buku-besar/pembayaran", label: "Pembayaran", hint: "Receive / Pay" },
  { to: "/sch/$sekolah/akuntansi/buku-besar/gl", label: "Buku Besar (GL)", hint: "GL Entry view" },
];

const ANGGARAN_LINKS: readonly QuickLink[] = [
  { to: "/sch/$sekolah/akuntansi/anggaran", label: "Anggaran", hint: "Budget per cost center" },
  { to: "/sch/$sekolah/akuntansi/anggaran/cost-center", label: "Cost Center", hint: "Pusat biaya" },
  { to: "/sch/$sekolah/akuntansi/anggaran/dimensi", label: "Dimensi Akuntansi", hint: "Dimensi pelaporan" },
];

const PAJAK_LINKS: readonly QuickLink[] = [
  { to: "/sch/$sekolah/akuntansi/pajak/spt-ppn", label: "SPT Masa PPN", hint: "Pelaporan PPN" },
  { to: "/sch/$sekolah/akuntansi/pajak/efaktur", label: "e-Faktur Export", hint: "CSV/XML DJP" },
  { to: "/sch/$sekolah/akuntansi/pajak/withholding", label: "Withholding Tax", hint: "PPh 21/22/23/4(2)" },
  { to: "/sch/$sekolah/akuntansi/pajak/ter", label: "PPh 21 TER & 4(2)", hint: "Tarif rate" },
];

const REFERENSI_LINKS: readonly QuickLink[] = [
  { to: "/sch/$sekolah/akuntansi/referensi/fiscal-year", label: "Fiscal Year", hint: "Tahun fiskal" },
  { to: "/sch/$sekolah/akuntansi/referensi/period", label: "Accounting Period", hint: "Periode akuntansi" },
  { to: "/sch/$sekolah/akuntansi/referensi/currency", label: "Currency Exchange", hint: "Kurs valas" },
  { to: "/sch/$sekolah/akuntansi/referensi/settings", label: "Pengaturan Modul", hint: "Vernon Accounting Settings" },
];

const ROOT_TYPE_TONE: Record<string, Tone> = {
  Asset: "emerald",
  Liability: "rose",
  Equity: "brand",
  Income: "sky",
  Expense: "amber",
};

const GUIDE_STEPS = [
  { title: "Siapkan fondasi (Referensi)", detail: "Buat Tahun Fiskal, Periode Akuntansi, dan Bagan Akun sebelum mulai memposting.", roles: ["akuntan"] },
  { title: "Posting transaksi (Buku Besar)", detail: "Jurnal Umum & Pembayaran mengalir otomatis ke GL Entry. Pastikan debit = kredit.", roles: ["akuntan"] },
  { title: "Kelola pajak Indonesia", detail: "SPT Masa PPN, e-Faktur, dan Withholding PPh 21/22/23/4(2) ada di sub-menu Pajak.", roles: ["akuntan"] },
  { title: "Pantau anggaran & laporan", detail: "Bandingkan realisasi vs anggaran per cost center. Tutup periode saat selesai.", roles: ["kepala", "akuntan"] },
];

const GUIDE_TIPS = [
  "Istilah asing (PPN, NSFP, TER) dijelaskan saat Anda mengarahkan kursor padanya.",
  "Mulai dari Referensi bila ini setup pertama — urutannya: Tahun Fiskal → Periode → Bagan Akun.",
];

function AkuntansiOverview() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const company = useActiveCompany();
  const role = useKeuanganRole();
  const [activeRole, setActiveRole] = useState<KeuanganRole>(role.isKepala ? "kepala" : "akuntan");

  const accountsQ = useResourceList<Account>(DOCTYPE.ACCOUNT, {
    fields: ["name", "root_type"],
    filters: company ? [["company", "=", company]] : [],
    limit_page_length: 0,
  });
  const journalQ = useResourceList<JournalEntry>(DOCTYPE.JOURNAL_ENTRY, {
    fields: ["name", "total_debit", "docstatus"],
    filters: company ? [["docstatus", "=", 1], ["company", "=", company]] : [["docstatus", "=", 1]],
    limit_page_length: 0,
  });
  const paymentQ = useResourceList<PaymentEntry>(DOCTYPE.PAYMENT_ENTRY, {
    fields: ["name", "paid_amount", "docstatus"],
    filters: company ? [["docstatus", "=", 1], ["company", "=", company]] : [["docstatus", "=", 1]],
    limit_page_length: 0,
  });
  const budgetQ = useResourceList<Budget>(DOCTYPE.BUDGET, {
    fields: ["name", "status"],
    filters: company ? [["company", "=", company]] : [],
    limit_page_length: 0,
  });
  const sptQ = useResourceList<SptMasaPPN>(DOCTYPE.SPT_MASA_PPN, {
    fields: ["name", "status"],
    filters: company ? [["company", "=", company]] : [],
    limit_page_length: 0,
  });
  const fiscalQ = useResourceList<FiscalYear>(DOCTYPE.FISCAL_YEAR, {
    fields: ["name"],
    filters: company ? [["company", "=", company]] : [],
    limit_page_length: 0,
  });

  const akunCount = accountsQ.data?.length ?? 0;
  const journalCount = journalQ.data?.length ?? 0;
  const paymentTotal = (paymentQ.data ?? []).reduce((acc, p) => acc + (p.paid_amount ?? 0), 0);
  const budgetCount = budgetQ.data?.length ?? 0;
  const sptDraft = (sptQ.data ?? []).filter((s) => (s.status ?? "Draft") === "Draft").length;

  /** Chart of accounts composition by root type. */
  const akunComposition = useMemo<ChartDatum[]>(() => {
    const totals = new Map<string, number>();
    for (const a of accountsQ.data ?? []) {
      const rt = a.root_type ?? "Lainnya";
      totals.set(rt, (totals.get(rt) ?? 0) + 1);
    }
    return [...totals.entries()].map(([label, value]) => ({
      label,
      value,
      tone: ROOT_TYPE_TONE[label] ?? "neutral",
    }));
  }, [accountsQ.data]);

  /** Setup completeness: which foundational pieces exist. */
  const setupPercent = useMemo(() => {
    const checks = [
      (fiscalQ.data?.length ?? 0) > 0,
      akunCount > 0,
      budgetCount > 0,
      journalCount > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [fiscalQ.data, akunCount, budgetCount, journalCount]);

  const setupTone: Tone = setupPercent >= 80 ? "emerald" : setupPercent >= 50 ? "amber" : "rose";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akuntansi"
        title="Pusat Akuntansi"
        description="Vernon Accounting — buku besar, anggaran, dan pajak Indonesia dalam satu tempat."
        actions={<Badge tone="brand" dot>vernon_accounting</Badge>}
      />

      <KeuanganRoleChips active={activeRole} onSelect={setActiveRole} />

      <KeuanganPageGuide
        storageId="akuntansi-dashboard"
        intro="Modul akuntansi penuh: dari bagan akun sampai pelaporan pajak. Ikuti langkah sesuai peran Anda."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bagan Akun" value={String(akunCount)} hint="Total akun aktif" icon={<IconChart />} accent="brand" />
        <StatCard label="Jurnal Submitted" value={String(journalCount)} hint="Posting valid" icon={<IconFile />} accent="emerald" />
        <StatCard label="Pembayaran" value={formatRupiah(paymentTotal)} hint="Total submitted" icon={<IconWallet />} accent="violet" />
        <StatCard label="Anggaran" value={String(budgetCount)} hint={`SPT draft: ${sptDraft}`} icon={<IconChart />} accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Komposisi Bagan Akun" description="Jumlah akun per tipe root">
          <div className="flex justify-center">
            <DonutChart
              data={akunComposition}
              centerTop={<span className="text-base font-semibold text-fg">{akunCount}</span>}
              centerBottom={<span className="text-[11px] text-muted-fg">akun</span>}
            />
          </div>
        </SectionCard>

        <SectionCard title="Kelengkapan Setup" description="Fondasi akuntansi yang sudah disiapkan">
          <div className="flex flex-col items-center gap-2">
            <ProgressRing value={setupPercent} tone={setupTone} label="setup beres" />
            <p className="text-center text-xs text-muted-fg">Tahun fiskal · akun · anggaran · jurnal</p>
          </div>
        </SectionCard>

        <SectionCard
          title="Buku Besar"
          description="Akun, jurnal, pembayaran, GL."
          action={
            <Link
              {...scopedLinkProps(sekolah, "/akuntansi/buku-besar/jurnal/new")}
              className="inline-flex items-center gap-1 text-sm text-brand hover:underline whitespace-nowrap"
            >
              <span className="inline-flex h-4 w-4"><IconPlus /></span>
              Jurnal Baru
            </Link>
          }
        >
          <LinkGrid items={BUKU_BESAR_LINKS} sekolah={sekolah} />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Anggaran & Dimensi" description="Budget per cost center + dimensi pelaporan.">
          <LinkGrid items={ANGGARAN_LINKS} sekolah={sekolah} />
        </SectionCard>
        <SectionCard title="Pajak Indonesia" description="PPN, PPh 21/22/23/4(2), e-Faktur, SPT Masa.">
          <LinkGrid items={PAJAK_LINKS} sekolah={sekolah} />
        </SectionCard>
        <SectionCard title="Referensi & Pengaturan" description="Tahun fiskal, periode, kurs, setelan modul.">
          <LinkGrid items={REFERENSI_LINKS} sekolah={sekolah} />
        </SectionCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/")({
  component: AkuntansiOverview,
});
