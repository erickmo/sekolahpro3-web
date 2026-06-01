/**
 * Budget detail page — Keuangan hub.
 *
 * Shows a single budget header plus its per-month allocation table, with
 * submit/cancel actions driven by docstatus. Presentation-only redesign: adds a
 * short page guide and glossary tooltips on jargon. The doc fetch
 * (useResourceDoc), action handlers (submitDoc/cancelDoc), and DOCTYPE wiring
 * are preserved verbatim.
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
  budgetStatusBadge,
  cancelDoc,
  formatRupiah,
  MONTH12,
  submitDoc,
  type Budget,
  type Month12,
} from "../data/akuntansi";
import { KeuanganPageGuide } from "../components/keuangan";

const FISCAL_YEAR_DEF = "Fiscal Year (tahun anggaran) — periode 12 bulan dasar penyusunan dan pelaporan anggaran.";
const OVERSPEND_DEF = "Overspend Action — perilaku saat realisasi melebihi anggaran: None (abaikan), Warn (peringatan), Stop (blokir transaksi).";

function BudgetDetailPage() {
  const { sekolah, name } = useParams({ from: "/sch/$sekolah/akuntansi/anggaran/budget/$name" });
  const navigate = useNavigate();
  const q = useResourceDoc<Budget>(DOCTYPE.BUDGET, name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (q.isLoading) return <div className="p-8 text-center text-sm text-muted-fg">Memuat…</div>;
  if (q.error || !q.data) return <Alert tone="danger" title="Gagal memuat">{(q.error as Error)?.message ?? "Tidak ditemukan."}</Alert>;

  const b = q.data;
  const badge = budgetStatusBadge(b.status);

  const action = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null);
    try { await fn(); await q.refetch(); } catch (e) { setErr(e instanceof Error ? e.message : "Gagal."); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Budget"
        title={b.name}
        description={`FY ${b.fiscal_year} · ${b.cost_center ?? "—"}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            {b.docstatus === 0 && <Button onClick={() => action(() => submitDoc(DOCTYPE.BUDGET, b.name))} disabled={busy}>Submit</Button>}
            {b.docstatus === 1 && <Button variant="destructive" onClick={() => action(() => cancelDoc(DOCTYPE.BUDGET, b.name))} disabled={busy}>Cancel</Button>}
            <Button variant="ghost" onClick={() => navigate({ to: "/sch/$sekolah/akuntansi/anggaran", params: { sekolah } })}>← Kembali</Button>
          </div>
        }
      />
      {err && <Alert tone="danger" title="Error">{err}</Alert>}

      <KeuanganPageGuide
        storageId="anggaran-budget-detail"
        intro="Halaman ini menampilkan detail satu budget beserta alokasi per bulan. Aksi yang tersedia mengikuti status dokumen."
        steps={[
          { title: "Tinjau alokasi", detail: "Periksa header (fiscal year, cost center) dan rincian alokasi tiap akun per bulan beserta totalnya." },
          { title: "Submit jika masih Draft", detail: "Budget berstatus Draft dapat di-Submit untuk mengaktifkan kontrol anggaran pada transaksi." },
          { title: "Cancel jika perlu", detail: "Budget yang sudah Submitted bisa di-Cancel; gunakan menu Amandemen untuk merevisi alokasinya." },
        ]}
      />

      <SectionCard
        title={
          <span className="inline-flex items-center gap-1">
            Header <GlossaryTooltip term="Fiscal Year" definition={FISCAL_YEAR_DEF} />
          </span>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoField label="Fiscal Year" value={b.fiscal_year} />
          <InfoField label="Company" value={b.company} />
          <InfoField label="Cost Center" value={b.cost_center ?? "—"} />
          <InfoField label="Status" value={b.status ?? "Draft"} />
        </div>
      </SectionCard>

      <SectionCard title="Alokasi per Bulan" padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-fg uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Account</th>
                <th className="px-4 py-2 text-left">
                  <span className="inline-flex items-center gap-1">
                    Overspend <GlossaryTooltip term="Overspend Action" definition={OVERSPEND_DEF} />
                  </span>
                </th>
                {MONTH12.map((m) => <th key={m} className="px-3 py-2 text-right">{m}</th>)}
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(b.accounts ?? []).map((row, i) => {
                const total = MONTH12.reduce((acc, m) => acc + ((row[m.toLowerCase() as Lowercase<Month12>] as number | undefined) ?? 0), 0);
                return (
                  <tr key={row.name ?? i} className="border-t border-border">
                    <td className="px-4 py-2">{row.account}</td>
                    <td className="px-4 py-2 text-xs">{row.overspend_action ?? "—"}</td>
                    {MONTH12.map((m) => (
                      <td key={m} className="px-3 py-2 text-right">{formatRupiah((row[m.toLowerCase() as Lowercase<Month12>] as number | undefined) ?? 0)}</td>
                    ))}
                    <td className="px-4 py-2 text-right font-medium">{formatRupiah(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/anggaran/budget/$name")({
  component: BudgetDetailPage,
});
