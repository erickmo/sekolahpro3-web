/**
 * Pembayaran PPDB (redesain) — pelacakan keuangan penerimaan.
 *
 * Tiga lapisan:
 *  1. PageGuide — tutorial singkat per-halaman (storageId "ppdb-pembayaran").
 *  2. PembayaranPanel — gauge terkumpul-vs-tagihan, donut status, daftar aging
 *     tunggakan + modal pencatatan manual (analitik dari mock Pendaftar).
 *  3. Tabel pembayaran backend — list + aksi "Buat Order" ke payment gateway
 *     (flow lama dipertahankan; status berubah Lunas otomatis via webhook).
 *
 * Catatan: status mark-paid lunas otomatis lewat payment_webhook backend —
 * panel ini menyediakan trigger order baru, bukan mengubah status manual.
 */

import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  PageHeader,
  Pagination,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { useCreatePaymentOrder } from "../lib/ppdbApi";
import { listPpdbForSekolah } from "../data/ppdb";
import { PageGuide } from "../components/guide/PageGuide";
import { PembayaranPanel } from "../components/ppdb/pembayaranPanel";

type Row = {
  name: string;
  pendaftaran_ppdb?: string;
  jumlah_tagihan?: number;
  jumlah_terbayar?: number;
  status?: string;
};

const STATUS_OPTIONS = ["Semua", "Belum Bayar", "Partial", "Lunas", "Gagal", "Refund"];
const PAGE_SIZE = 25;
// Tanggal acuan agregasi mock — selaras dengan dashboard PPDB sampai backend wired.
const TODAY_ISO = "2026-05-25";
// Status pembayaran yang tidak boleh memicu order baru (sudah final).
const ORDER_DISABLED_STATUSES = new Set(["Lunas", "Refund"]);
// Persen bilah progres maksimum (hindari magic number 100 inline).
const PROGRESS_MAX_PCT = 100;

// Tutorial per-halaman — langkah ringkas memakai modul pembayaran.
const GUIDE_STEPS = [
  { title: "Pantau penerimaan dana", detail: "Gauge menunjukkan dana terkumpul terhadap total tagihan." },
  { title: "Tindak lanjuti tunggakan", detail: "Daftar aging menyorot tagihan tertunda lebih dari 3 hari." },
  { title: "Buat order pembayaran", detail: "Pada tabel, klik Buat Order untuk mengirim tagihan ke gateway." },
];
const GUIDE_TIPS = [
  "Status berubah menjadi Lunas otomatis saat gateway mengirim webhook settlement.",
  "Gunakan Catat Pembayaran untuk transaksi tunai/transfer di luar gateway.",
];

/** Nada Badge per status pembayaran backend. */
function statusTone(s: string | undefined): "success" | "warning" | "danger" | "brand" | "neutral" {
  if (s === "Lunas") return "success";
  if (s === "Partial") return "brand";
  if (s === "Belum Bayar") return "warning";
  if (s === "Gagal" || s === "Refund") return "danger";
  return "neutral";
}

/** Format angka rupiah ringkas untuk sel tabel. */
function formatRp(n: number | undefined): string {
  return `Rp ${(n ?? 0).toLocaleString("id-ID")}`;
}

/** Persentase terbayar terhadap tagihan, dibatasi 0..100. */
function paidPercent(terbayar: number, tagihan: number): number {
  if (tagihan <= 0) return 0;
  return Math.min(PROGRESS_MAX_PCT, Math.round((terbayar / tagihan) * PROGRESS_MAX_PCT));
}

/** Bangun parameter resource:list dari filter aktif (fields + filters + paging). */
function buildListParams(status: string, search: string, page: number) {
  const filters: Array<[string, string, unknown]> = [];
  if (status !== "Semua") filters.push(["status", "=", status]);
  if (search.trim()) filters.push(["name", "like", `%${search.trim()}%`]);
  return {
    fields: ["name", "pendaftaran_ppdb", "jumlah_tagihan", "jumlah_terbayar", "status"],
    ...(filters.length ? { filters } : {}),
    order_by: "`modified` desc",
    limit_start: (page - 1) * PAGE_SIZE,
    limit_page_length: PAGE_SIZE + 1,
  };
}

export function PembayaranPpdbPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua");
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const createOrder = useCreatePaymentOrder();

  // Mock list per sekolah — sumber analitik panel sampai endpoint agregat siap.
  const ppdbList = useMemo(() => listPpdbForSekolah(sekolah), [sekolah]);

  const params = useMemo(() => buildListParams(status, search, page), [status, search, page]);

  const q = useResourceList<Row>("Pembayaran PPDB", params);
  const fetched = q.data ?? [];
  const hasNext = fetched.length > PAGE_SIZE;
  const rows = hasNext ? fetched.slice(0, PAGE_SIZE) : fetched;

  /** Buat order pembayaran baru lewat gateway; buka link bayar di tab baru. */
  async function onBuatOrder(r: Row): Promise<void> {
    if (!r.pendaftaran_ppdb) {
      setFeedback({ tone: "err", msg: "Pembayaran tanpa pendaftaran_ppdb." });
      return;
    }
    setFeedback(null);
    try {
      const res = await createOrder.mutateAsync({ pendaftaran_ppdb: r.pendaftaran_ppdb });
      if (res?.payment_url) {
        window.open(res.payment_url, "_blank", "noopener,noreferrer");
        setFeedback({ tone: "ok", msg: `Order ${res.order_id} (${res.provider}) — link bayar terbuka di tab baru.` });
      } else {
        setFeedback({ tone: "ok", msg: "Order dibuat." });
      }
    } catch (e) {
      setFeedback({ tone: "err", msg: (e as Error)?.message ?? "Gagal membuat order." });
    }
  }

  const COLUMNS: Column<Row>[] = [
    {
      key: "name",
      header: "No. Bayar",
      cell: (r) => <span className="font-mono text-xs">{r.name}</span>,
    },
    {
      key: "pendaftaran_ppdb",
      header: "Pendaftaran",
      cell: (r) =>
        r.pendaftaran_ppdb ? (
          <Link
            to="/sch/$sekolah/ppdb/$noPendaftaran"
            params={{ sekolah, noPendaftaran: r.pendaftaran_ppdb }}
            className="font-mono text-xs text-brand hover:underline"
          >
            {r.pendaftaran_ppdb}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "jumlah_tagihan",
      header: "Tagihan",
      align: "right",
      cell: (r) => <span className="tabular-nums">{formatRp(r.jumlah_tagihan)}</span>,
    },
    {
      key: "jumlah_terbayar",
      header: "Terbayar",
      align: "right",
      cell: (r) => (
        <div className="text-right">
          <div className="tabular-nums">{formatRp(r.jumlah_terbayar)}</div>
          {(r.jumlah_tagihan ?? 0) > 0 ? (
            <div className="mt-0.5 ml-auto h-1 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-brand"
                style={{ width: `${paidPercent(r.jumlah_terbayar ?? 0, r.jumlah_tagihan ?? 0)}%` }}
              />
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={statusTone(r.status)} dot>
          {r.status ?? "—"}
        </Badge>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      align: "right",
      cell: (r) => {
        const canOrder = !ORDER_DISABLED_STATUSES.has(r.status ?? "");
        return (
          <Button
            size="sm"
            variant="outline"
            disabled={!canOrder || createOrder.isPending}
            onClick={() => onBuatOrder(r)}
          >
            Buat Order
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Pembayaran PPDB"
        description="Pantau penerimaan dana, tindak lanjuti tunggakan, dan buat order ke payment gateway."
      />

      <PageGuide
        storageId="ppdb-pembayaran"
        intro="Modul ini melacak keuangan PPDB dari tagihan sampai pelunasan."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <PembayaranPanel list={ppdbList} todayIso={TODAY_ISO} />

      <SectionCard padded={false}>
        <div className="p-3">
          <FilterBar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setPage(1);
              },
              placeholder: "Cari nomor bayar...",
            }}
            filters={[
              {
                key: "status",
                label: "Status",
                value: status,
                options: STATUS_OPTIONS.map((v) => ({ value: v, label: v })),
                onChange: (v) => {
                  setStatus(v);
                  setPage(1);
                },
              },
            ]}
          />
        </div>

        {feedback && (
          <div
            className={
              "border-b border-border px-4 py-2 text-xs " +
              (feedback.tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")
            }
          >
            {feedback.msg}
          </div>
        )}

        <DataTable
          data={rows}
          columns={COLUMNS}
          rowKey={(r) => r.name}
          empty={q.isLoading ? "Memuat..." : q.isError ? "Gagal memuat." : "Belum ada pembayaran."}
        />

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={(page - 1) * PAGE_SIZE + rows.length + (hasNext ? 1 : 0)}
          onPageChange={setPage}
        />
      </SectionCard>

      <p className="text-xs text-muted-fg">
        Tip: status berubah otomatis menjadi <strong>Lunas</strong> saat gateway mengirim webhook
        settlement. Tidak perlu update manual.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ppdb/pembayaran")({ component: PembayaranPpdbPage });
