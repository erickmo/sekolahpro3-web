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

  if (!open) return null;
  return (
    <div role="dialog" className="fixed inset-0 bg-black/40 flex items-end">
      <div className="w-full bg-bg rounded-t-xl p-4">
        <div className="flex gap-2 mb-3">
          {nfcSupported && (
            <button aria-label="NFC" className={tab === "nfc" ? "font-bold" : ""} onClick={() => setTab("nfc")}>NFC</button>
          )}
          <button aria-label="QR" className={tab === "qr" ? "font-bold" : ""} onClick={() => setTab("qr")}>QR</button>
          <button aria-label="Tutup" className="ml-auto" onClick={onClose}>✕</button>
        </div>
        {tab === "nfc" && (
          <div className="text-center py-8">
            <div className="text-lg font-semibold mb-2">Tap kartu siswa</div>
            <div className="text-sm text-muted-fg">Dekatkan kartu ke belakang HP</div>
          </div>
        )}
        {tab === "qr" && (
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Scan QR siswa</div>
            <video ref={videoRef} className="w-full max-h-64 mx-auto rounded" />
          </div>
        )}
      </div>
    </div>
  );
}
