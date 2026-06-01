/**
 * Detail Pembayaran — tampilan satu Payment Entry vernon_accounting.
 *
 * Tambahan presentasi: panduan singkat aksi submit/cancel dan glossary pada
 * tabel referensi. Aksi submit/cancel dan pemuatan dokumen dipertahankan apa adanya.
 */
import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
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
  type PaymentEntry,
} from "../data/akuntansi";
import { KeuanganPageGuide } from "../components/keuangan";
import { defOf } from "../lib/glossary";

const GUIDE_STEPS = [
  { title: "Periksa detail pembayaran", detail: "Pastikan tipe, akun asal/tujuan, dan nominal sudah sesuai sebelum mengubah status." },
  { title: "Submit jika masih draft", detail: "Tombol Submit memposting pembayaran ke buku besar dan memengaruhi saldo kas/bank.", roles: ["kasir", "bendahara"] },
  { title: "Cancel bila perlu", detail: "Pembayaran submitted bisa di-Cancel; pembatalan membalik dampaknya di GL.", roles: ["bendahara"] },
];

function PembayaranDetailPage() {
  const { sekolah, name } = useParams({ from: "/sch/$sekolah/akuntansi/buku-besar/pembayaran/$name" });
  const navigate = useNavigate();
  const q = useResourceDoc<PaymentEntry>(DOCTYPE.PAYMENT_ENTRY, name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (q.isLoading) return <div className="p-8 text-center text-sm text-muted-fg">Memuat…</div>;
  if (q.error || !q.data) return <Alert tone="danger" title="Gagal memuat">{(q.error as Error)?.message ?? "Tidak ditemukan."}</Alert>;

  const p = q.data;
  const badge = docstatusBadge(p.docstatus);

  const action = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null);
    try { await fn(); await q.refetch(); } catch (e) { setErr(e instanceof Error ? e.message : "Gagal."); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Payment Entry"
        title={p.name}
        description={`${p.payment_type} · ${formatTanggal(p.posting_date)} · ${p.company}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            {p.docstatus === 0 && <Button onClick={() => action(() => submitDoc(DOCTYPE.PAYMENT_ENTRY, p.name))} disabled={busy}>Submit</Button>}
            {p.docstatus === 1 && <Button variant="destructive" onClick={() => action(() => cancelDoc(DOCTYPE.PAYMENT_ENTRY, p.name))} disabled={busy}>Cancel</Button>}
            <Button variant="ghost" onClick={() => navigate({ to: "/sch/$sekolah/akuntansi/buku-besar/pembayaran", params: { sekolah } })}>← Kembali</Button>
          </div>
        }
      />

      {err && <Alert tone="danger" title="Error">{err}</Alert>}

      <KeuanganPageGuide
        storageId="pembayaran-detail"
        intro="Tinjau dan ubah status pembayaran di sini. Aksi yang tersedia menyesuaikan status dokumen."
        steps={GUIDE_STEPS}
      />

      <SectionCard title="Informasi">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoField label="Payment Type" value={p.payment_type} />
          <InfoField label="Posting Date" value={formatTanggal(p.posting_date)} />
          <InfoField label="Company" value={p.company} />
          <InfoField label="Party" value={p.party_name ?? p.party ?? "—"} />
          <InfoField label="Paid From" value={p.paid_from ?? "—"} />
          <InfoField label="Paid To" value={p.paid_to ?? "—"} />
          <InfoField label="Paid Amount" value={formatRupiah(p.paid_amount ?? 0)} />
          <InfoField label="Received Amount" value={formatRupiah(p.received_amount ?? 0)} />
        </div>
        {p.remarks && <div className="mt-3"><InfoField label="Remarks" value={p.remarks} /></div>}
      </SectionCard>

      {(p.references?.length ?? 0) > 0 && (
        <SectionCard title="Referensi" padded={false}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-fg">
              <tr>
                <th className="px-4 py-2 text-left">Reference Doctype</th>
                <th className="px-4 py-2 text-left">Reference</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-right">
                  <GlossaryTooltip term="Outstanding" definition={defOf("Outstanding") ?? "Sisa tagihan yang belum lunas atas dokumen referensi."} />
                </th>
                <th className="px-4 py-2 text-right">Allocated</th>
              </tr>
            </thead>
            <tbody>
              {p.references!.map((r, i) => (
                <tr key={r.name ?? i} className="border-t border-border">
                  <td className="px-4 py-2">{r.reference_doctype}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.reference_name}</td>
                  <td className="px-4 py-2 text-right">{formatRupiah(r.total_amount ?? 0)}</td>
                  <td className="px-4 py-2 text-right">{formatRupiah(r.outstanding_amount ?? 0)}</td>
                  <td className="px-4 py-2 text-right">{formatRupiah(r.allocated_amount ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/buku-besar/pembayaran/$name")({
  component: PembayaranDetailPage,
});
