import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { scopedLinkProps } from "../lib/scoped";
import {
  Badge,
  DashboardTemplate,
  PageHeader,
  SectionCard,
  StatCard,
  IconChart,
  IconFile,
  IconWallet,
  IconPlus,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  formatRupiah,
  type Account,
  type Budget,
  type JournalEntry,
  type PaymentEntry,
  type SptMasaPPN,
} from "../data/akuntansi";

interface QuickLink {
  to: string;
  label: string;
  hint: string;
}

const BUKU_BESAR_LINKS: readonly QuickLink[] = [
  { to: "/$sekolah/akuntansi/buku-besar/akun", label: "Bagan Akun", hint: "Chart of Accounts" },
  { to: "/$sekolah/akuntansi/buku-besar/jurnal", label: "Jurnal Umum", hint: "Posting manual" },
  { to: "/$sekolah/akuntansi/buku-besar/pembayaran", label: "Pembayaran", hint: "Receive / Pay" },
  { to: "/$sekolah/akuntansi/buku-besar/gl", label: "Buku Besar (GL)", hint: "GL Entry view" },
];

const ANGGARAN_LINKS: readonly QuickLink[] = [
  { to: "/$sekolah/akuntansi/anggaran", label: "Anggaran", hint: "Budget per cost center" },
  { to: "/$sekolah/akuntansi/anggaran/cost-center", label: "Cost Center", hint: "Pusat biaya" },
  { to: "/$sekolah/akuntansi/anggaran/dimensi", label: "Dimensi Akuntansi", hint: "Dimensi pelaporan" },
];

const PAJAK_LINKS: readonly QuickLink[] = [
  { to: "/$sekolah/akuntansi/pajak/spt-ppn", label: "SPT Masa PPN", hint: "Pelaporan PPN" },
  { to: "/$sekolah/akuntansi/pajak/efaktur", label: "e-Faktur Export", hint: "CSV/XML DJP" },
  { to: "/$sekolah/akuntansi/pajak/withholding", label: "Withholding Tax", hint: "PPh 21/22/23/4(2)" },
  { to: "/$sekolah/akuntansi/pajak/ter", label: "PPh 21 TER & 4(2)", hint: "Tarif rate" },
];

const REFERENSI_LINKS: readonly QuickLink[] = [
  { to: "/$sekolah/akuntansi/referensi/fiscal-year", label: "Fiscal Year", hint: "Tahun fiskal" },
  { to: "/$sekolah/akuntansi/referensi/period", label: "Accounting Period", hint: "Periode akuntansi" },
  { to: "/$sekolah/akuntansi/referensi/currency", label: "Currency Exchange", hint: "Kurs valas" },
  { to: "/$sekolah/akuntansi/referensi/settings", label: "Pengaturan Modul", hint: "Vernon Accounting Settings" },
];

function LinkGrid({ items, sekolah }: { items: readonly QuickLink[]; sekolah: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((it) => (
        <Link
          key={it.to}
          {...scopedLinkProps(sekolah, it.to.replace("/$sekolah", ""))}
          className="group flex items-start gap-3 rounded-md border border-border p-3 hover:bg-muted/60 transition-colors"
        >
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand">
            <IconWallet />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-fg group-hover:text-brand truncate">{it.label}</div>
            <div className="text-xs text-muted-fg truncate">{it.hint}</div>
          </div>
          <span className="text-muted-fg text-xs">→</span>
        </Link>
      ))}
    </div>
  );
}

function AkuntansiOverview() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const accountsQ = useResourceList<Account>(DOCTYPE.ACCOUNT, {
    fields: ["name"],
    limit_page_length: 0,
  });
  const journalQ = useResourceList<JournalEntry>(DOCTYPE.JOURNAL_ENTRY, {
    fields: ["name", "total_debit", "docstatus"],
    filters: [["docstatus", "=", 1]],
    limit_page_length: 0,
  });
  const paymentQ = useResourceList<PaymentEntry>(DOCTYPE.PAYMENT_ENTRY, {
    fields: ["name", "paid_amount", "docstatus"],
    filters: [["docstatus", "=", 1]],
    limit_page_length: 0,
  });
  const budgetQ = useResourceList<Budget>(DOCTYPE.BUDGET, {
    fields: ["name", "status"],
    limit_page_length: 0,
  });
  const sptQ = useResourceList<SptMasaPPN>(DOCTYPE.SPT_MASA_PPN, {
    fields: ["name", "status"],
    limit_page_length: 0,
  });

  const akunCount = accountsQ.data?.length ?? 0;
  const journalCount = journalQ.data?.length ?? 0;
  const paymentTotal = (paymentQ.data ?? []).reduce((acc, p) => acc + (p.paid_amount ?? 0), 0);
  const budgetCount = budgetQ.data?.length ?? 0;
  const sptDraft = (sptQ.data ?? []).filter((s) => (s.status ?? "Draft") === "Draft").length;

  return (
    <DashboardTemplate
      header={
        <PageHeader
          eyebrow="Operasional"
          title="Akuntansi"
          description="Vernon Accounting — buku besar, anggaran, pajak Indonesia."
          actions={<Badge tone="brand" dot>vernon_accounting</Badge>}
        />
      }
      stats={[
        <StatCard
          key="accounts"
          label="Bagan Akun"
          value={String(akunCount)}
          hint="Total akun aktif"
          icon={<IconChart />}
          accent="brand"
        />,
        <StatCard
          key="journals"
          label="Jurnal Submitted"
          value={String(journalCount)}
          hint="Posting valid"
          icon={<IconFile />}
          accent="emerald"
        />,
        <StatCard
          key="payments"
          label="Pembayaran"
          value={formatRupiah(paymentTotal)}
          hint="Total submitted"
          icon={<IconWallet />}
          accent="violet"
        />,
        <StatCard
          key="budget"
          label="Anggaran"
          value={String(budgetCount)}
          hint={`SPT draft: ${sptDraft}`}
          icon={<IconChart />}
          accent="amber"
        />,
      ]}
      primary={
        <>
          <SectionCard
            title="Buku Besar"
            description="Akun, jurnal, pembayaran, GL ledger."
            action={
              <Link
                {...scopedLinkProps(sekolah, "/akuntansi/buku-besar/jurnal/new")}
                className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
              >
                <IconPlus /> Jurnal Baru
              </Link>
            }
          >
            <LinkGrid items={BUKU_BESAR_LINKS} sekolah={sekolah} />
          </SectionCard>

          <SectionCard
            title="Anggaran & Dimensi"
            description="Budget per cost center + dimensi pelaporan."
          >
            <LinkGrid items={ANGGARAN_LINKS} sekolah={sekolah} />
          </SectionCard>

          <SectionCard
            title="Pajak Indonesia"
            description="PPN, PPh 21/22/23/4(2), e-Faktur, SPT Masa."
          >
            <LinkGrid items={PAJAK_LINKS} sekolah={sekolah} />
          </SectionCard>
        </>
      }
      side={
        <SectionCard title="Referensi & Pengaturan" padded={false}>
          <div className="px-4 py-3">
            <LinkGrid items={REFERENSI_LINKS} sekolah={sekolah} />
          </div>
        </SectionCard>
      }
    />
  );
}

export const Route = createFileRoute("/$sekolah/akuntansi/")({
  component: AkuntansiOverview,
});
