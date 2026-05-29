import { useState } from "react";

interface Props {
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}

const PIN_LENGTH = 4;

export function OperatorPinModal({ onConfirm, onCancel }: Props) {
  const [pin, setPin] = useState("");
  return (
    <div
      role="dialog"
      aria-label="Ganti operator"
      className="fixed inset-0 bg-black/40 flex items-center justify-center"
    >
      <div className="bg-bg p-4 rounded-xl w-72">
        <div className="font-semibold mb-2">Ganti operator</div>
        <input
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="w-full border p-2 rounded text-center text-2xl tracking-widest"
          aria-label="PIN operator"
        />
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border rounded py-2"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(pin)}
            disabled={pin.length !== PIN_LENGTH}
            className="flex-1 bg-brand text-white rounded py-2 disabled:opacity-50"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
