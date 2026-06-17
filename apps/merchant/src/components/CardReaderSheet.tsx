import { useState, useEffect } from "react";
import { useNfcReader, useQrScanner, type CardToken } from "@sekolahpro/card";

interface Props {
  open: boolean;
  onClose: () => void;
  onToken: (t: CardToken) => void;
  nfcSupported: boolean;
}

export function CardReaderSheet({ open, onClose, onToken, nfcSupported }: Props) {
  const [tab, setTab] = useState<"nfc" | "qr">(nfcSupported ? "nfc" : "qr");

  useNfcReader({
    enabled: open && tab === "nfc" && nfcSupported,
    onRead: onToken,
  });

  const { videoRef, start, stop } = useQrScanner({ onRead: onToken });

  useEffect(() => {
    if (open && tab === "qr") start();
    return () => stop();
  }, [open, tab, start, stop]);

  // Dev-only seam: when mocks are on and the sheet is open, expose a window
  // helper so Playwright (and ad-hoc devtools) can inject a synthetic card
  // token without simulating NFC hardware.
  useEffect(() => {
    if (!open || import.meta.env.VITE_USE_MOCKS !== "true") return;
    (window as unknown as { __devInjectCardToken?: (raw: string) => void }).__devInjectCardToken = (raw: string) => {
      void import("@sekolahpro/card").then(({ parseCardToken }) => {
        try {
          onToken(parseCardToken(raw));
        } catch {
          /* ignore malformed dev token */
        }
      });
    };
    return () => {
      delete (window as unknown as { __devInjectCardToken?: (raw: string) => void }).__devInjectCardToken;
    };
  }, [open, onToken]);

  if (!open) return null;
  return (
    <div role="dialog" className="fixed inset-0 z-50 flex items-end bg-black/50">
      <div className="w-full rounded-t-2xl bg-bg p-4 pb-6 shadow-xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
        <div className="mb-4 flex items-center gap-2">
          {nfcSupported && (
            <button
              aria-label="NFC"
              onClick={() => setTab("nfc")}
              className={`h-9 rounded-full px-4 text-sm font-medium ${tab === "nfc" ? "bg-brand text-white" : "border border-border text-muted-fg"}`}
            >
              NFC
            </button>
          )}
          <button
            aria-label="QR"
            onClick={() => setTab("qr")}
            className={`h-9 rounded-full px-4 text-sm font-medium ${tab === "qr" ? "bg-brand text-white" : "border border-border text-muted-fg"}`}
          >
            QR
          </button>
          <button
            aria-label="Tutup"
            onClick={onClose}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-fg hover:bg-muted"
          >
            ✕
          </button>
        </div>
        {tab === "nfc" && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-3xl">
              💳
            </div>
            <div className="mb-1 text-lg font-semibold text-fg">Tap kartu siswa</div>
            <div className="text-sm text-muted-fg">Dekatkan kartu ke belakang HP</div>
          </div>
        )}
        {tab === "qr" && (
          <div className="text-center">
            <div className="mb-3 text-lg font-semibold text-fg">Scan QR siswa</div>
            <video ref={videoRef} className="mx-auto max-h-64 w-full rounded-xl bg-muted" />
          </div>
        )}
      </div>
    </div>
  );
}
