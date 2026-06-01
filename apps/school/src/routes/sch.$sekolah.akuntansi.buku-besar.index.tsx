/**
 * Buku Besar — ringkasan sub-modul ledger di dalam hub Keuangan.
 *
 * Role-aware (Akuntan / Kepala), visual: distribusi debit vs kredit GL untuk
 * memperlihatkan keseimbangan saldo sekilas. Tetap memakai wiring
 * vernon_accounting (useResourceList + company scope) tanpa perubahan.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { SectionCard, StatCard, IconChart, IconWallet, GlossaryTooltip } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  formatRupiah,
  type GLEntry,
  type JournalEntry,
  type PaymentEntry,
} from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";
import { DistributionBar, type DistributionSegment } from "../components/viz";
import { KeuanganRoleChips, KeuanganPageGuide } from "../components/keuangan";
import { useKeuanganRole, type KeuanganRole } from "../lib/keuanganRole";
import { defOf } from "../lib/glossary";

const GUIDE_STEPS = [
  { title: "Pahami arah saldo", detail: "Debit dan kredit GL harus seimbang. Selisih nol berarti pembukuan sehat.", roles: ["akuntan"] },
  { title: "Telusuri jurnal & pembayaran terbaru", detail: "Dua daftar di bawah menampilkan posting terkini; klik untuk membuka detailnya.", roles: ["akuntan", "bendahara"] },
  { title: "Pantau kesehatan ledger", detail: "Gunakan kartu Selisih untuk deteksi cepat jurnal yang belum seimbang.", roles: ["kepala"] },
];

const GUIDE_TIPS = [
  "Istilah GL (General Ledger) dijelaskan saat kursor diarahkan ke judulnya.",
  "Buka 'Lihat semua' untuk daftar lengkap jurnal atau pembayaran.",
];

function BukuBesarRingkasan() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const company = useActiveCompany();
  const role = useKeuanganRole();
  const [activeRole, setActiveRole] = useState<KeuanganRole>(role.primary);
  const journalQ = useResourceList<JournalEntry>(DOCTYPE.JOURNAL_ENTRY, {
    fields: ["name", "posting_date", "total_debit", "docstatus"],
    filters: withCompanyFilter(undefined, company),
    order_by: "posting_date desc, creation desc",
    limit_page_length: 10,
  });
  const paymentQ = useResourceList<PaymentEntry>(DOCTYPE.PAYMENT_ENTRY, {
    fields: ["name", "posting_date", "payment_type", "paid_amount", "docstatus"],
    filters: withCompanyFilter(undefined, company),
    order_by: "posting_date desc, creation desc",
    limit_page_length: 10,
  });
  const glQ = useResourceList<GLEntry>(DOCTYPE.GL_ENTRY, {
    fields: ["name", "debit", "credit"],
    filters: withCompanyFilter(undefined, company),
    limit_page_length: 0,
  });

  const totalDebit = (glQ.data ?? []).reduce((acc, g) => acc + (g.debit ?? 0), 0);
  const totalCredit = (glQ.data ?? []).reduce((acc, g) => acc + (g.credit ?? 0), 0);

  /** Debit vs kredit composition for the balance distribution bar. */
  const balanceSegments = useMemo<DistributionSegment[]>(
    () => [
      { label: "Debit", value: totalDebit, tone: "brand" },
      { label: "Kredit", value: totalCredit, tone: "emerald" },
    ],
    [totalDebit, totalCredit],
  );

  return (
    <div className="space-y-4">
      <KeuanganRoleChips active={activeRole} onSelect={setActiveRole} />

      <KeuanganPageGuide
        storageId="buku-besar-ringkasan"
        intro="Ringkasan buku besar: saldo debit/kredit dan transaksi terbaru. Ikuti langkah sesuai peran Anda."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <SectionCard
        title={
          <span className="inline-flex items-center gap-1">
            Komposisi Saldo{" "}
            <GlossaryTooltip term="GL" definition={defOf("GL") ?? "General Ledger — buku besar tempat semua posting akuntansi terkumpul."} />
          </span>
        }
        description="Perbandingan total debit dan kredit GL"
      >
        <DistributionBar segments={balanceSegments} />
        <p className={`mt-2 text-xs ${totalDebit === totalCredit ? "text-emerald-600" : "text-rose-600"}`}>
          {totalDebit === totalCredit ? "Debit dan kredit seimbang." : `Selisih ${formatRupiah(totalDebit - totalCredit)}.`}
        </p>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Total Debit GL" value={formatRupiah(totalDebit)} icon={<IconChart />} accent="brand" />
        <StatCard label="Total Kredit GL" value={formatRupiah(totalCredit)} icon={<IconChart />} accent="emerald" />
        <StatCard
          label="Selisih"
          value={formatRupiah(totalDebit - totalCredit)}
          hint={totalDebit === totalCredit ? "Seimbang" : "Tidak seimbang"}
          icon={<IconWallet />}
          accent={totalDebit === totalCredit ? "emerald" : "rose"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard
          title="Jurnal Terbaru"
          action={<Link to="/sch/$sekolah/akuntansi/buku-besar/jurnal" params={{ sekolah }} className="text-xs text-brand hover:underline">Lihat semua →</Link>}
        >
          <ul className="divide-y divide-border">
            {(journalQ.data ?? []).map((j) => (
              <li key={j.name} className="py-2 flex items-center justify-between text-sm">
                <Link to="/sch/$sekolah/akuntansi/buku-besar/jurnal/$name" params={{ sekolah, name: j.name }} className="hover:underline">
                  {j.name}
                </Link>
                <span className="text-muted-fg">{formatRupiah(j.total_debit ?? 0)}</span>
              </li>
            ))}
            {!journalQ.isLoading && (journalQ.data ?? []).length === 0 && (
              <li className="py-4 text-center text-sm text-muted-fg">Belum ada jurnal.</li>
            )}
          </ul>
        </SectionCard>

        <SectionCard
          title="Pembayaran Terbaru"
          action={<Link to="/sch/$sekolah/akuntansi/buku-besar/pembayaran" params={{ sekolah }} className="text-xs text-brand hover:underline">Lihat semua →</Link>}
        >
          <ul className="divide-y divide-border">
            {(paymentQ.data ?? []).map((p) => (
              <li key={p.name} className="py-2 flex items-center justify-between text-sm">
                <Link to="/sch/$sekolah/akuntansi/buku-besar/pembayaran/$name" params={{ sekolah, name: p.name }} className="hover:underline">
                  <span className="font-mono">{p.name}</span>
                  <span className="ml-2 text-xs text-muted-fg">{p.payment_type}</span>
                </Link>
                <span className="text-muted-fg">{formatRupiah(p.paid_amount ?? 0)}</span>
              </li>
            ))}
            {!paymentQ.isLoading && (paymentQ.data ?? []).length === 0 && (
              <li className="py-4 text-center text-sm text-muted-fg">Belum ada pembayaran.</li>
            )}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/buku-besar/")({
  component: BukuBesarRingkasan,
});
