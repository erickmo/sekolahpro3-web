/**
 * Detail Jurnal Umum — tampilan satu Journal Entry vernon_accounting.
 *
 * Tambahan presentasi: panduan singkat aksi submit/cancel dan glossary Cost
 * Center. Aksi submit/cancel dan pemuatan dokumen dipertahankan apa adanya.
 */
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  GlossaryTooltip,
  InfoField,
  PageHeader,
  SectionCard,
} from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  cancelDoc,
  docstatusBadge,
  formatRupiah,
  formatTanggal,
  submitDoc,
  type JournalEntry,
} from "../data/akuntansi";
import { KeuanganPageGuide } from "../components/keuangan";
import { defOf } from "../lib/glossary";

const GUIDE_STEPS = [
  { title: "Periksa baris jurnal", detail: "Pastikan akun, debit, dan kredit sudah benar sebelum mengubah status." },
  { title: "Submit jika masih draft", detail: "Tombol Submit memposting jurnal ke buku besar sehingga memengaruhi saldo.", roles: ["akuntan"] },
  { title: "Cancel bila perlu", detail: "Jurnal yang sudah submitted bisa di-Cancel; pembatalan membuat balik GL Entry.", roles: ["akuntan"] },
];

function JurnalDetailPage() {
  const { sekolah, name } = useParams({ from: "/sch/$sekolah/akuntansi/buku-besar/jurnal/$name" });
  const navigate = useNavigate();
  const q = useResourceDoc<JournalEntry>(DOCTYPE.JOURNAL_ENTRY, name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (q.isLoading) return <div className="p-8 text-center text-sm text-muted-fg">Memuat…</div>;
  if (q.error || !q.data) return <Alert tone="danger" title="Gagal memuat">{(q.error as Error)?.message ?? "Tidak ditemukan."}</Alert>;

  const j = q.data;
  const badge = docstatusBadge(j.docstatus);

  const action = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null);
    try { await fn(); await q.refetch(); } catch (e) { setErr(e instanceof Error ? e.message : "Gagal."); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Jurnal Umum"
        title={j.name}
        description={`Posting ${formatTanggal(j.posting_date)} · ${j.company}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            {j.docstatus === 0 && (
              <Button onClick={() => action(() => submitDoc(DOCTYPE.JOURNAL_ENTRY, j.name))} disabled={busy}>Submit</Button>
            )}
            {j.docstatus === 1 && (
              <Button variant="destructive" onClick={() => action(() => cancelDoc(DOCTYPE.JOURNAL_ENTRY, j.name))} disabled={busy}>Cancel</Button>
            )}
            <Button variant="ghost" onClick={() => navigate({ to: "/sch/$sekolah/akuntansi/buku-besar/jurnal", params: { sekolah } })}>← Kembali</Button>
          </div>
        }
      />

      {err && <Alert tone="danger" title="Error">{err}</Alert>}

      <KeuanganPageGuide
        storageId="jurnal-detail"
        intro="Tinjau dan ubah status jurnal di sini. Aksi yang tersedia menyesuaikan status dokumen."
        steps={GUIDE_STEPS}
      />

      <SectionCard title="Informasi">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoField label="Posting Date" value={formatTanggal(j.posting_date)} />
          <InfoField label="Company" value={j.company} />
          <InfoField label="Total Debit" value={formatRupiah(j.total_debit ?? 0)} />
          <InfoField label="Total Kredit" value={formatRupiah(j.total_credit ?? 0)} />
        </div>
        {j.remarks && <div className="mt-3"><InfoField label="Remarks" value={j.remarks} /></div>}
      </SectionCard>

      <SectionCard title="Baris Jurnal" padded={false}>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-fg">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Account</th>
              <th className="text-left px-4 py-2">Party</th>
              <th className="text-left px-4 py-2">
                <GlossaryTooltip term="Cost Center" definition={defOf("Cost Center") ?? "Pusat biaya — dimensi untuk mengelompokkan biaya/pendapatan per unit."} />
              </th>
              <th className="text-right px-4 py-2">Debit</th>
              <th className="text-right px-4 py-2">Kredit</th>
              <th className="text-left px-4 py-2">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {(j.accounts ?? []).map((row, i) => (
              <tr key={row.name ?? i} className="border-t border-border">
                <td className="px-4 py-2 text-xs text-muted-fg">{i + 1}</td>
                <td className="px-4 py-2">{row.account}</td>
                <td className="px-4 py-2 text-xs">{row.party_type ? `${row.party_type} / ${row.party}` : "—"}</td>
                <td className="px-4 py-2 text-xs">{row.cost_center ?? "—"}</td>
                <td className="px-4 py-2 text-right">{formatRupiah(row.debit ?? 0)}</td>
                <td className="px-4 py-2 text-right">{formatRupiah(row.credit ?? 0)}</td>
                <td className="px-4 py-2 text-xs text-muted-fg">{row.user_remark ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/buku-besar/jurnal/$name")({
  component: JurnalDetailPage,
});
