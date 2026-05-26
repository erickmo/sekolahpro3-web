import type { TransaksiJenis } from "../koperasi-simpanan/transaksiForm";

export type QuickAction =
  | { kind: "transaksi"; jenis: TransaksiJenis; label: string; hotkey: string }
  | { kind: "cek-saldo"; label: string; hotkey: string };

export const ACTION_SETOR: QuickAction = { kind: "transaksi", jenis: "Setor", label: "Setor Tunai", hotkey: "F2" };
export const ACTION_TARIK: QuickAction = { kind: "transaksi", jenis: "Tarik", label: "Tarik Tunai", hotkey: "F3" };
export const ACTION_TOPUP: QuickAction = { kind: "transaksi", jenis: "Transfer", label: "Top-up / Transfer", hotkey: "F4" };
export const ACTION_SALDO: QuickAction = { kind: "cek-saldo", label: "Cek Saldo", hotkey: "F5" };

export const QUICK_ACTIONS: QuickAction[] = [ACTION_SETOR, ACTION_TARIK, ACTION_TOPUP, ACTION_SALDO];

interface QuickActionGridProps {
  disabled?: boolean;
  onSelect: (action: QuickAction) => void;
}

export function QuickActionGrid({ disabled, onSelect }: QuickActionGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {QUICK_ACTIONS.map((a) => (
        <button
          key={a.hotkey}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(a)}
          className="group flex min-h-[5.5rem] flex-col items-start justify-between rounded-lg border border-border bg-bg p-4 text-left transition hover:border-brand hover:bg-brand-subtle disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-base font-medium">{a.label}</span>
          <kbd className="mt-2 rounded border border-border bg-bg-subtle px-2 py-0.5 text-xs font-mono">
            {a.hotkey}
          </kbd>
        </button>
      ))}
    </div>
  );
}
