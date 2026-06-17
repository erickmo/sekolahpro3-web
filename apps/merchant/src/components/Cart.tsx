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

/** Square ≥44px touch target for cart steppers / remove. */
function IconBtn({
  label,
  onClick,
  children,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const toneCls =
    tone === "danger"
      ? "text-danger hover:bg-danger/10"
      : "text-fg hover:bg-muted active:bg-muted";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`h-11 w-11 shrink-0 rounded-lg border border-border text-lg font-semibold leading-none ${toneCls} active:scale-95 transition`}
    >
      {children}
    </button>
  );
}

export function Cart({ lines, disabled, onChangeQty, onRemove, onTap }: Props) {
  const total = lines.reduce((a, l) => a + l.item.harga * l.qty, 0);
  const empty = lines.length === 0;

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-fg">
          Keranjang
        </h2>
      </div>

      <ul className="flex-1 overflow-auto px-3 py-2">
        {empty ? (
          <li className="flex h-full min-h-32 flex-col items-center justify-center gap-1 px-4 text-center text-muted-fg">
            <span className="text-3xl">🛒</span>
            <span className="text-sm">Keranjang kosong</span>
            <span className="text-xs">Pilih item dari katalog</span>
          </li>
        ) : (
          lines.map((l) => (
            <li
              key={l.item.name}
              className="flex items-center gap-2 rounded-lg px-1 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-fg">{l.item.nama}</div>
                <div className="text-xs tabular-nums text-muted-fg">
                  {formatRp(l.item.harga)}
                </div>
              </div>
              <IconBtn
                label={`kurangi ${l.item.nama}`}
                onClick={() => onChangeQty(l.item.name, Math.max(0, l.qty - 1))}
              >
                −
              </IconBtn>
              <span className="w-7 text-center text-base font-semibold tabular-nums">
                {l.qty}
              </span>
              <IconBtn
                label={`tambah ${l.item.nama}`}
                onClick={() => onChangeQty(l.item.name, l.qty + 1)}
              >
                +
              </IconBtn>
              <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                {formatRp(l.item.harga * l.qty)}
              </span>
              <IconBtn
                label={`hapus ${l.item.nama}`}
                onClick={() => onRemove(l.item.name)}
                tone="danger"
              >
                ✕
              </IconBtn>
            </li>
          ))
        )}
      </ul>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-sm font-medium text-muted-fg">Total</span>
          <span
            data-testid="cart-total"
            className="text-2xl font-bold tabular-nums text-fg"
          >
            {formatRp(total)}
          </span>
        </div>
        <Button
          onClick={onTap}
          disabled={disabled || empty}
          className="h-14 w-full text-base"
        >
          Tap kartu siswa
        </Button>
      </div>
    </div>
  );
}
