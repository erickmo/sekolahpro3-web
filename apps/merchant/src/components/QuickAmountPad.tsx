import { useState } from "react";

interface Props { onConfirm: (amount: number) => void; onCancel: () => void }

export function QuickAmountPad({ onConfirm, onCancel }: Props) {
  const [s, setS] = useState("");
  const append = (d: string) => setS((p) => (p + d).slice(0, 9));
  const back = () => setS((p) => p.slice(0, -1));
  const amt = Number(s || "0");
  return (
    <div className="p-4">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-fg">
        Nominal manual
      </div>
      <div className="mb-3 rounded-xl bg-muted px-4 py-3 text-right text-4xl font-bold tabular-nums text-fg">
        Rp {amt.toLocaleString("id-ID")}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map((k) => {
          const onClick =
            k === "⌫" ? back :
            k === "✓" ? () => onConfirm(amt) :
            () => append(k);
          const confirm = k === "✓";
          return (
            <button
              key={k}
              onClick={onClick}
              className={`h-16 rounded-xl text-xl font-semibold transition active:scale-95 ${
                confirm
                  ? "bg-brand text-white"
                  : "border border-border bg-bg text-fg hover:bg-muted"
              }`}
            >
              {confirm ? "Konfirmasi" : k}
            </button>
          );
        })}
      </div>
      <button onClick={onCancel} className="mt-3 h-11 w-full text-sm font-medium text-muted-fg hover:text-fg">
        Batal
      </button>
    </div>
  );
}
