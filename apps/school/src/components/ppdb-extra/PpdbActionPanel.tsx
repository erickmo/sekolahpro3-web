/**
 * Status-aware action surface for a single Pendaftaran PPDB.
 *
 * Reads `currentStatus` and renders only the actions allowed by the PPDB
 * pipeline (Draft → Diajukan → Diverifikasi → Seleksi → Diterima/Ditolak →
 * Selesai). Each action calls the matching whitelisted endpoint and
 * surfaces success/error via inline message.
 *
 * Source: docs/domains/ppdb/README.html §4 + §2 (Pipeline).
 */

import { useState } from "react";
import { Button, Modal, Badge } from "@sekolahpro/ui";
import {
  useAjukanPendaftaran,
  useVerifikasiPendaftaran,
  useFinalisasiPendaftaran,
  useCreatePaymentOrder,
  type VerifikasiStatus,
} from "../../lib/ppdbApi";

interface Props {
  pendaftaranName: string;
  currentStatus: string | undefined;
  seleksiName?: string | undefined;
  /** Render style: full panel (vertical) or compact inline. */
  variant?: "panel" | "inline";
}

type DialogKind = null | "verifikasi" | "finalisasi" | "payment";

const NEXT_AFTER_VERIFIKASI: VerifikasiStatus[] = [
  "Diverifikasi",
  "Seleksi",
  "Diterima",
  "Ditolak",
];

export function PpdbActionPanel({ pendaftaranName, currentStatus, variant = "panel" }: Props) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [catatan, setCatatan] = useState("");
  const [verifikasiTo, setVerifikasiTo] = useState<VerifikasiStatus>("Diverifikasi");
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const ajukan = useAjukanPendaftaran();
  const verifikasi = useVerifikasiPendaftaran();
  const finalisasi = useFinalisasiPendaftaran();
  const createOrder = useCreatePaymentOrder();

  const status = currentStatus ?? "";
  const isPending = ajukan.isPending || verifikasi.isPending || finalisasi.isPending || createOrder.isPending;

  // Visibility matrix — drive button render from pipeline position.
  const canAjukan = status === "Draft";
  const canVerifikasi = status === "Diajukan" || status === "Diverifikasi" || status === "Seleksi";
  const canFinalisasi = status === "Diterima" || status === "Daftar Ulang";
  const canPay = !["Selesai", "Ditolak", "Mengundurkan Diri"].includes(status);

  const onAjukan = async () => {
    setFeedback(null);
    try {
      await ajukan.mutateAsync({ pendaftaran_ppdb: pendaftaranName });
      setFeedback({ tone: "ok", msg: "Pendaftaran diajukan." });
    } catch (e) {
      setFeedback({ tone: "err", msg: errMsg(e) });
    }
  };

  const onVerifikasi = async () => {
    setFeedback(null);
    try {
      await verifikasi.mutateAsync({
        pendaftaran_ppdb: pendaftaranName,
        status: verifikasiTo,
        ...(catatan ? { catatan } : {}),
      });
      setDialog(null);
      setCatatan("");
      setFeedback({ tone: "ok", msg: `Status diubah ke ${verifikasiTo}.` });
    } catch (e) {
      setFeedback({ tone: "err", msg: errMsg(e) });
    }
  };

  const onFinalisasi = async () => {
    setFeedback(null);
    try {
      const r = (await finalisasi.mutateAsync({ pendaftaran_ppdb: pendaftaranName })) as
        | { siswa?: string }
        | undefined;
      setDialog(null);
      setFeedback({
        tone: "ok",
        msg: r?.siswa ? `Siswa dibuat: ${r.siswa}.` : "Pendaftaran difinalisasi.",
      });
    } catch (e) {
      setFeedback({ tone: "err", msg: errMsg(e) });
    }
  };

  const onCreateOrder = async () => {
    setFeedback(null);
    try {
      const r = await createOrder.mutateAsync({ pendaftaran_ppdb: pendaftaranName });
      setDialog(null);
      if (r?.payment_url) {
        window.open(r.payment_url, "_blank", "noopener,noreferrer");
        setFeedback({ tone: "ok", msg: `Order dibuat: ${r.order_id} (${r.provider}).` });
      } else {
        setFeedback({ tone: "ok", msg: "Order dibuat." });
      }
    } catch (e) {
      setFeedback({ tone: "err", msg: errMsg(e) });
    }
  };

  const buttons = (
    <>
      {canAjukan && (
        <Button size="sm" onClick={onAjukan} disabled={isPending}>
          Ajukan Pendaftaran
        </Button>
      )}
      {canVerifikasi && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setVerifikasiTo("Diverifikasi");
            setDialog("verifikasi");
          }}
          disabled={isPending}
        >
          Ubah Status
        </Button>
      )}
      {canPay && (
        <Button size="sm" variant="outline" onClick={() => setDialog("payment")} disabled={isPending}>
          Buat Order Pembayaran
        </Button>
      )}
      {canFinalisasi && (
        <Button
          size="sm"
          onClick={() => setDialog("finalisasi")}
          disabled={isPending}
          className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
        >
          Finalisasi → Buat Siswa
        </Button>
      )}
    </>
  );

  return (
    <div className={variant === "panel" ? "space-y-3" : "flex flex-wrap gap-2"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-fg">Status:</span>
        <Badge tone="brand">{status || "—"}</Badge>
      </div>
      <div className={variant === "panel" ? "flex flex-wrap gap-2" : "contents"}>{buttons}</div>

      {feedback && (
        <div
          className={
            "rounded-md border px-3 py-2 text-xs " +
            (feedback.tone === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-rose-300 bg-rose-50 text-rose-800")
          }
        >
          {feedback.msg}
        </div>
      )}

      <Modal
        open={dialog === "verifikasi"}
        onClose={() => setDialog(null)}
        title="Ubah Status Pendaftaran"
        description="Transisikan ke salah satu status berikut."
        tone="brand"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialog(null)}>Batal</Button>
            <Button onClick={onVerifikasi} disabled={verifikasi.isPending}>
              {verifikasi.isPending ? "Memproses..." : "Konfirmasi"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-fg">Status Tujuan</label>
            <div className="flex flex-wrap gap-2">
              {NEXT_AFTER_VERIFIKASI.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setVerifikasiTo(s)}
                  className={
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition " +
                    (verifikasiTo === s
                      ? "border-brand bg-brand text-white"
                      : "border-border bg-card hover:border-brand")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-fg">Catatan (opsional)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
              placeholder="Tulis alasan, catatan panitia, dsb."
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={dialog === "finalisasi"}
        onClose={() => setDialog(null)}
        title="Finalisasi → Buat Siswa"
        description="Aksi idempoten: buat record Siswa + Pendaftaran Siswa, lalu set pendaftaran ini ke Selesai."
        tone="emerald"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialog(null)}>Batal</Button>
            <Button
              onClick={onFinalisasi}
              disabled={finalisasi.isPending}
              className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
            >
              {finalisasi.isPending ? "Memproses..." : "Finalisasi"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-fg">
          Pastikan Daftar Ulang sudah lunas dan rombongan belajar sudah ditetapkan.
          Jika sudah, lanjutkan untuk membuat record Siswa secara otomatis.
        </p>
      </Modal>

      <Modal
        open={dialog === "payment"}
        onClose={() => setDialog(null)}
        title="Buat Order Pembayaran"
        description="Akan membuat link bayar di payment gateway (Midtrans/Xendit) sesuai konfigurasi."
        tone="amber"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialog(null)}>Batal</Button>
            <Button onClick={onCreateOrder} disabled={createOrder.isPending}>
              {createOrder.isPending ? "Memproses..." : "Buat & Buka Link"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-fg">
          Link bayar akan dibuka di tab baru. Kirim link tersebut ke calon siswa
          jika belum diteruskan otomatis lewat email.
        </p>
      </Modal>
    </div>
  );
}

function errMsg(e: unknown): string {
  if (!e) return "Gagal.";
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return String(e);
}
