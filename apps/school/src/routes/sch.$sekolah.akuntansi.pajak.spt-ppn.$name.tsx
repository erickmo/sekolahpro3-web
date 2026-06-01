/**
 * Detail SPT Masa PPN: ringkasan PPN keluaran/masukan dan aksi submit/cancel.
 *
 * Presentation-only redesign: adds a short page guide and glossary tooltips on
 * the PPN summary heading. The doc query and submit/cancel actions are untouched.
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
  formatRupiah,
  sptStatusBadge,
  submitDoc,
  type SptMasaPPN,
} from "../data/akuntansi";
import { KeuanganPageGuide } from "../components/keuangan";
import { defOf } from "../lib/glossary";

function SptPpnDetailPage() {
  const { sekolah, name } = useParams({ from: "/sch/$sekolah/akuntansi/pajak/spt-ppn/$name" });
  const navigate = useNavigate();
  const q = useResourceDoc<SptMasaPPN>(DOCTYPE.SPT_MASA_PPN, name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (q.isLoading) return <div className="p-8 text-center text-sm text-muted-fg">Memuat…</div>;
  if (q.error || !q.data) return <Alert tone="danger" title="Gagal memuat">{(q.error as Error)?.message ?? "Tidak ditemukan."}</Alert>;

  const s = q.data;
  const badge = sptStatusBadge(s.status);

  const action = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null);
    try { await fn(); await q.refetch(); } catch (e) { setErr(e instanceof Error ? e.message : "Gagal."); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="SPT Masa PPN"
        title={s.name}
        description={`${s.tax_period} · ${s.company}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            {s.docstatus === 0 && <Button onClick={() => action(() => submitDoc(DOCTYPE.SPT_MASA_PPN, s.name))} disabled={busy}>Submit</Button>}
            {s.docstatus === 1 && <Button variant="destructive" onClick={() => action(() => cancelDoc(DOCTYPE.SPT_MASA_PPN, s.name))} disabled={busy}>Cancel</Button>}
            <Button variant="ghost" onClick={() => navigate({ to: "/sch/$sekolah/akuntansi/pajak/spt-ppn", params: { sekolah } })}>← Kembali</Button>
          </div>
        }
      />
      {err && <Alert tone="danger" title="Error">{err}</Alert>}
      <KeuanganPageGuide
        storageId="spt-ppn-detail"
        intro="Periksa angka SPT sebelum melapor: kurang bayar adalah selisih PPN keluaran dikurangi PPN masukan yang harus disetor."
        steps={[
          { title: "Cek ringkasan", detail: "Bandingkan PPN keluaran dan PPN masukan; nilai kurang bayar muncul otomatis." },
          { title: "Submit jika sesuai", detail: "Saat status masih Draft, tekan Submit untuk mengunci SPT sebelum lapor." },
          { title: "Cancel bila keliru", detail: "SPT yang sudah submit bisa di-Cancel jika ada koreksi data." },
        ]}
      />
      <SectionCard title={<>Ringkasan <GlossaryTooltip term="PPN" definition={defOf("PPN") ?? "Pajak Pertambahan Nilai."} /></>}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoField label="Tax Period" value={s.tax_period} />
          <InfoField label="Company" value={s.company} />
          <InfoField label="e-Faktur Export" value={s.efaktur_export ?? "—"} />
          <InfoField label="Status" value={s.status ?? "Draft"} />
          <InfoField label="PPN Keluaran" value={formatRupiah(s.ppn_keluaran ?? 0)} />
          <InfoField label="PPN Masukan" value={formatRupiah(s.ppn_masukan ?? 0)} />
          <InfoField label="Kurang Bayar" value={formatRupiah(s.ppn_kurang_bayar ?? 0)} />
        </div>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/pajak/spt-ppn/$name")({ component: SptPpnDetailPage });
