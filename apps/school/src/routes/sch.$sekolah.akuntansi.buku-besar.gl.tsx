/**
 * Buku Besar (GL Entry) — daftar semua posting ledger vernon_accounting.
 *
 * Tambahan presentasi: panduan halaman, glossary GL, dan distribusi debit vs
 * kredit baris terfilter di atas tabel. Filter, query, dan order_by tidak diubah.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  DataTable,
  FilterBar,
  GlossaryTooltip,
  PageHeader,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  formatRupiah,
  formatTanggal,
  type GLEntry,
} from "../data/akuntansi";
import { useActiveCompany } from "../lib/akuntansi-scope";
import { DistributionBar, type DistributionSegment } from "../components/viz";
import { KeuanganPageGuide } from "../components/keuangan";
import { defOf } from "../lib/glossary";

const ALL = "Semua";

const GUIDE_STEPS = [
  { title: "Cari posting ledger", detail: "Saring per status (Active/Cancelled) atau ketik voucher, akun, atau remarks." },
  { title: "Telusuri sumber voucher", detail: "Kolom Voucher menunjukkan dokumen asal (Journal Entry, Payment Entry) yang membentuk baris GL." },
  { title: "Verifikasi keseimbangan", detail: "Baris total di bawah tabel menjumlahkan debit dan kredit baris terfilter.", roles: ["akuntan"] },
];

const GUIDE_TIPS = ["GL Entry dibuat otomatis saat jurnal atau pembayaran di-submit — tidak diinput manual di sini."];

function GLPage() {
  const [q, setQ] = useState("");
  const [account, setAccount] = useState("");
  const [includeCancelled, setIncludeCancelled] = useState(ALL);
  const company = useActiveCompany();

  const list = useResourceList<GLEntry>(DOCTYPE.GL_ENTRY, {
    fields: ["name", "posting_date", "account", "debit", "credit", "voucher_type", "voucher_no", "party_type", "party", "is_cancelled", "remarks"],
    filters: [
      ...(company ? [["company", "=", company] as [string, string, unknown]] : []),
      ...(account ? [["account", "like", `%${account}%`] as [string, string, unknown]] : []),
      ...(includeCancelled === ALL ? [] : [["is_cancelled", "=", includeCancelled === "1" ? 1 : 0] as [string, string, unknown]]),
    ],
    order_by: "posting_date desc, creation desc",
    limit_page_length: 500,
  });

  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (!q) return all;
    const n = q.toLowerCase();
    return all.filter((r) => r.voucher_no?.toLowerCase().includes(n) || r.account?.toLowerCase().includes(n) || (r.remarks ?? "").toLowerCase().includes(n));
  }, [list.data, q]);

  const cols: Column<GLEntry>[] = [
    { key: "posting_date", header: "Tanggal", cell: (r) => formatTanggal(r.posting_date), width: "110px" },
    { key: "account", header: "Account", cell: (r) => <span className="text-xs">{r.account}</span> },
    { key: "voucher", header: "Voucher", cell: (r) => <span className="font-mono text-xs">{r.voucher_type} / {r.voucher_no}</span> },
    { key: "party", header: "Party", cell: (r) => r.party_type ? <span className="text-xs">{r.party_type}/{r.party}</span> : "—" },
    { key: "debit", header: "Debit", cell: (r) => formatRupiah(r.debit ?? 0), align: "right" },
    { key: "credit", header: "Kredit", cell: (r) => formatRupiah(r.credit ?? 0), align: "right" },
    { key: "cancel", header: "Status", cell: (r) => r.is_cancelled ? <Badge tone="danger">Cancelled</Badge> : <Badge tone="success">Active</Badge>, align: "center" },
  ];

  const totalD = rows.reduce((a, r) => a + (r.debit ?? 0), 0);
  const totalC = rows.reduce((a, r) => a + (r.credit ?? 0), 0);

  const balanceSegments: DistributionSegment[] = [
    { label: "Debit", value: totalD, tone: "brand" },
    { label: "Kredit", value: totalC, tone: "emerald" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Buku Besar (GL)"
        description={
          <span className="inline-flex flex-wrap items-center gap-1">
            <GlossaryTooltip term="GL" definition={defOf("GL") ?? "General Ledger — buku besar tempat semua posting akuntansi terkumpul."} /> Entry — semua posting yang menghasilkan pergerakan ledger.
          </span>
        }
      />
      <KeuanganPageGuide
        storageId="buku-besar-gl"
        intro="Buku Besar memuat setiap baris posting yang menggerakkan saldo akun. Baris di sini hanya untuk dibaca."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />
      {(totalD > 0 || totalC > 0) && (
        <SectionCard title="Debit vs Kredit (terfilter)" description={`${rows.length} baris GL`}>
          <DistributionBar segments={balanceSegments} />
        </SectionCard>
      )}
      <FilterBar
        search={{ value: q, placeholder: "Cari voucher / akun / remarks…", onChange: setQ }}
        filters={[
          {
            key: "cancel", label: "Status", value: includeCancelled,
            options: [{ value: ALL, label: "Semua" }, { value: "0", label: "Active" }, { value: "1", label: "Cancelled" }],
            onChange: setIncludeCancelled,
          },
        ]}
        trailing={
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="Filter account…"
            className="h-9 rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        }
      />
      <SectionCard padded={false}>
        <DataTable<GLEntry>
          data={rows}
          columns={cols}
          rowKey={(r) => r.name}
          footer={
            <tr className="border-t border-border bg-muted/30 text-sm font-medium">
              <td className="px-4 py-2" colSpan={4}>Total ({rows.length} baris)</td>
              <td className="px-4 py-2 text-right">{formatRupiah(totalD)}</td>
              <td className="px-4 py-2 text-right">{formatRupiah(totalC)}</td>
              <td></td>
            </tr>
          }
          empty={<div className="p-8 text-center text-sm text-muted-fg">{list.isLoading ? "Memuat…" : "Tidak ada GL Entry."}</div>}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/buku-besar/gl")({
  component: GLPage,
});
