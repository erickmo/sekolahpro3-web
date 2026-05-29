import { Button } from "@sekolahpro/ui";

export interface CartLineItem { name: string; nama: string; harga: number }
export interface CartLine { item: CartLineItem; qty: number }

interface Props {
  lines: CartLine[];
  disabled: boolean;
  onChangeQty: (name: string, qty: number) => void;
  onRemove: (name: string) => void;
  onTap: () => void;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function Cart({ lines, disabled, onChangeQty, onRemove, onTap }: Props) {
  const total = lines.reduce((a, l) => a + l.item.harga * l.qty, 0);
  return (
    <div className="flex flex-col gap-2 p-3 border-t bg-bg">
      <ul className="flex-1 overflow-auto">
        {lines.map((l) => (
          <li key={l.item.name} className="flex items-center gap-2 py-1">
            <span className="flex-1 truncate">{l.item.nama}</span>
            <button aria-label={`kurangi ${l.item.nama}`} onClick={() => onChangeQty(l.item.name, Math.max(0, l.qty - 1))}>−</button>
            <span className="w-6 text-center tabular-nums">{l.qty}</span>
            <button aria-label={`tambah ${l.item.nama}`} onClick={() => onChangeQty(l.item.name, l.qty + 1)}>+</button>
            <span className="w-24 text-right tabular-nums">{formatRp(l.item.harga * l.qty)}</span>
            <button aria-label={`hapus ${l.item.nama}`} onClick={() => onRemove(l.item.name)}>✕</button>
          </li>
        ))}
      </ul>
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span data-testid="cart-total" className="tabular-nums">{formatRp(total)}</span>
      </div>
      <Button onClick={onTap} disabled={disabled || lines.length === 0}>
        Tap kartu siswa
      </Button>
    </div>
  );
}
