// ABS-003 — Layar Kartu QR absensi siswa.
//
// Siswa menampilkan QR berumur pendek (JWT yang di-mint backend, TTL 30 detik)
// di stasiun absensi. Komponen `QrCardView` murni & prop-injected supaya bisa
// diuji tanpa jaringan; `QrRoute` membungkusnya dengan `frappeFetch` nyata.
import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";
import { frappeFetch } from "@sekolahpro/api-client";
import { Alert, PageHeader, SectionCard } from "@sekolahpro/ui";

/** Method backend yang mencetak token QR sesi siswa. */
const MINT_QR_METHOD = "sekolahpro.attendance.api.qr.mint_qr";

/** Interval refresh default — di bawah TTL backend (30 detik) untuk antisipasi clock-skew. */
const DEFAULT_REFRESH_MS = 25_000;

/** Lebar/tinggi render canvas QR dalam piksel. */
const QR_CANVAS_SIZE = 240;

/** Bentuk respons mint_qr. */
export type QrToken = {
  token: string;
  exp: number;
};

export type QrCardViewProps = {
  /** Mencetak token QR baru; di-inject supaya dapat diuji. */
  mintQr: () => Promise<QrToken>;
  /** Interval refresh dalam milidetik. */
  refreshMs?: number;
};

/**
 * Kartu QR siswa: pada mount + setiap `refreshMs`, panggil `mintQr()` lalu
 * gambar token ke `<canvas>`. Error apa pun ditampilkan via `role="alert"`.
 * Interval dibersihkan saat unmount dan setState dijaga agar tidak terjadi
 * setelah komponen di-unmount.
 */
export function QrCardView({ mintQr, refreshMs = DEFAULT_REFRESH_MS }: QrCardViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const renderToken = (token: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Tangani penolakan toCanvas (mis. canvas 2d-context tak tersedia di
      // jsdom) supaya tidak menjadi unhandled rejection — kegagalan gambar
      // bukan kegagalan mint, jadi state error mint tidak diubah.
      QRCode.toCanvas(canvas, token, { width: QR_CANVAS_SIZE }).catch(() => {});
    };

    const refresh = async () => {
      try {
        const { token } = await mintQr();
        if (!alive) return;
        setError(null);
        renderToken(token);
      } catch {
        if (alive) setError("Gagal memuat kode QR. Coba lagi sebentar.");
      }
    };

    void refresh();
    const timer = setInterval(() => void refresh(), refreshMs);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [mintQr, refreshMs]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Absensi"
        title="Kartu QR"
        description="Tunjukkan kode ini ke petugas absensi. Kode otomatis diperbarui."
      />
      <SectionCard title="Kode Absensi" description="Berlaku singkat — selalu pakai kode terbaru.">
        <div className="flex flex-col items-center gap-4 py-2">
          {error ? (
            <Alert tone="danger" title="Tidak dapat menampilkan QR">
              {error}
            </Alert>
          ) : null}
          <canvas
            data-testid="qr-canvas"
            ref={canvasRef}
            width={QR_CANVAS_SIZE}
            height={QR_CANVAS_SIZE}
            className="rounded-lg border border-border bg-white"
          />
        </div>
      </SectionCard>
    </div>
  );
}

/** Wrapper rute: men-inject `mintQr` nyata via `frappeFetch`. */
function QrRoute() {
  return <QrCardView mintQr={() => frappeFetch<QrToken>(MINT_QR_METHOD, {})} />;
}

export const Route = createFileRoute("/qr")({ component: QrRoute });
