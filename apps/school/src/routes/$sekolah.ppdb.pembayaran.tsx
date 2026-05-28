/**
 * Pembayaran PPDB — list + create payment order via gateway.
 *
 * Each row offers contextual action:
 *   - "Belum Lunas" / "Partial" → "Buat Order" (create_payment_order endpoint)
 *   - "Lunas" → tampilkan status; opsi Tandai Refund (manual)
 *
 * Catatan: status mark-paid lunas otomatis lewat payment_webhook backend —
 * panel ini menyediakan trigger order baru, bukan mengubah status manual.
 */

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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

type Row = {
  name: string;
  pendaftaran_ppdb?: string;
  jumlah_tagihan?: number;
  jumlah_terbayar?: number;
  status?: string;
};

const STATUS_OPTIONS = ["Semua", "Belum Bayar", "Partial", "Lunas", "Gagal", "Refund"];
const PAGE_SIZE = 25;

function PembayaranPpdbPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua");
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const createOrder = useCreatePaymentOrder();

  const params = useMemo(() => {
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
  }, [status, search, page]);

  const q = useResourceList<Row>("Pembayaran PPDB", params);
  const fetched = q.data ?? [];
  const hasNext = fetched.length > PAGE_SIZE;
  const rows = hasNext ? fetched.slice(0, PAGE_SIZE) : fetched;

  const onBuatOrder = async (r: Row) => {
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
  };

  const statTone = (s: string | undefined): "success" | "warning" | "danger" | "brand" | "neutral" => {
    if (s === "Lunas") return "success";
    if (s === "Partial") return "brand";
    if (s === "Belum Bayar") return "warning";
    if (s === "Gagal" || s === "Refund") return "danger";
    return "neutral";
  };

  const fmtRp = (n: number | undefined) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`;

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
            to="/ppdb/$noPendaftaran"
            params={{ noPendaftaran: r.pendaftaran_ppdb }}
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
      cell: (r) => <span className="tabular-nums">{fmtRp(r.jumlah_tagihan)}</span>,
    },
    {
      key: "jumlah_terbayar",
      header: "Terbayar",
      align: "right",
      cell: (r) => (
        <div className="text-right">
          <div className="tabular-nums">{fmtRp(r.jumlah_terbayar)}</div>
          {(r.jumlah_tagihan ?? 0) > 0 ? (
            <div className="mt-0.5 h-1 w-24 ml-auto overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-brand"
                style={{
                  width: `${Math.min(100, Math.round(((r.jumlah_terbayar ?? 0) / (r.jumlah_tagihan ?? 1)) * 100))}%`,
                }}
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
        <Badge tone={statTone(r.status)} dot>
          {r.status ?? "—"}
        </Badge>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      align: "right",
      cell: (r) => {
        const canOrder = r.status !== "Lunas" && r.status !== "Refund";
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
        description="Pantau pembayaran calon siswa; buat order ke payment gateway saat dibutuhkan."
      />

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
              (feedback.tone === "ok"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-rose-50 text-rose-800")
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
        Tip: status berubah otomatis menjadi <strong>Lunas</strong> saat gateway
        mengirim webhook settlement. Tidak perlu update manual.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/ppdb/pembayaran")({ component: PembayaranPpdbPage });
