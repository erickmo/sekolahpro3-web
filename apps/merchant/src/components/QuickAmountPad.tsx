import { useState } from "react";

interface Props { onConfirm: (amount: number) => void; onCancel: () => void }

export function QuickAmountPad({ onConfirm, onCancel }: Props) {
  const [s, setS] = useState("");
  const append = (d: string) => setS((p) => (p + d).slice(0, 9));
  const back = () => setS((p) => p.slice(0, -1));
  const amt = Number(s || "0");
  return (
    <div className="p-3">
      <div className="text-3xl text-right tabular-nums mb-2">Rp {amt.toLocaleString("id-ID")}</div>
      <div className="grid grid-cols-3 gap-2">
        {["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map((k) => {
          const onClick =
            k === "⌫" ? back :
            k === "✓" ? () => onConfirm(amt) :
            () => append(k);
          return <button key={k} onClick={onClick} className="rounded-lg border py-3">{k === "✓" ? "Konfirmasi" : k}</button>;
        })}
      </div>
      <button onClick={onCancel} className="mt-2 w-full text-sm text-muted-fg">Batal</button>
    </div>
  );
}
