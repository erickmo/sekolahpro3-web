import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { SectionCard, StatCard, IconChart, IconWallet } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  formatRupiah,
  type GLEntry,
  type JournalEntry,
  type PaymentEntry,
} from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";

function BukuBesarRingkasan() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const company = useActiveCompany();
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

  return (
    <div className="space-y-4">
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
          action={<Link to="/$sekolah/akuntansi/buku-besar/jurnal" params={{ sekolah }} className="text-xs text-brand hover:underline">Lihat semua →</Link>}
        >
          <ul className="divide-y divide-border">
            {(journalQ.data ?? []).map((j) => (
              <li key={j.name} className="py-2 flex items-center justify-between text-sm">
                <Link to="/$sekolah/akuntansi/buku-besar/jurnal/$name" params={{ sekolah, name: j.name }} className="hover:underline">
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
          action={<Link to="/$sekolah/akuntansi/buku-besar/pembayaran" params={{ sekolah }} className="text-xs text-brand hover:underline">Lihat semua →</Link>}
        >
          <ul className="divide-y divide-border">
            {(paymentQ.data ?? []).map((p) => (
              <li key={p.name} className="py-2 flex items-center justify-between text-sm">
                <Link to="/$sekolah/akuntansi/buku-besar/pembayaran/$name" params={{ sekolah, name: p.name }} className="hover:underline">
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

export const Route = createFileRoute("/$sekolah/akuntansi/buku-besar/")({
  component: BukuBesarRingkasan,
});
