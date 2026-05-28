import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  token: string;
  expIso: string;
  onRefreshNeeded: () => void;
  size?: number;
}

const TICK_MS = 1000;

function remainingSeconds(expIso: string): number {
  const ms = new Date(expIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}

export function QRCountdown({ token, expIso, onRefreshNeeded, size = 224 }: Props) {
  const [remaining, setRemaining] = useState<number>(() => remainingSeconds(expIso));

  useEffect(() => {
    setRemaining(remainingSeconds(expIso));
    const id = setInterval(() => {
      const next = remainingSeconds(expIso);
      setRemaining(next);
      if (next <= 0) {
        clearInterval(id);
        onRefreshNeeded();
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [expIso, onRefreshNeeded]);

  return (
    <div data-testid="qr-countdown" className="flex flex-col items-center gap-3">
      <div className="rounded-lg bg-white p-4 shadow-sm border border-border">
        <QRCodeSVG value={token} size={size} level="M" includeMargin={false} />
      </div>
      <div className="text-sm text-muted-fg">
        Berlaku <span data-testid="qr-remaining" className="font-semibold text-fg">{remaining}</span> detik
      </div>
    </div>
  );
}
