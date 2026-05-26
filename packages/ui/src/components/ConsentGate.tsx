import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  /** True = pemrosesan diizinkan, render children. False = render block. */
  granted: boolean;
  /** Purpose label, e.g. "Publikasi Foto". */
  purpose: string;
  /** Children rendered when granted=true. */
  children: ReactNode;
  /** Callback when user clicks "Minta Persetujuan" button. */
  onRequestConsent?: (() => void) | undefined;
  className?: string | undefined;
  /** Variant for layout — inline (compact) vs card (default). */
  variant?: "card" | "inline" | undefined;
}

export function ConsentGate({
  granted,
  purpose,
  children,
  onRequestConsent,
  className,
  variant = "card",
}: Props) {
  if (granted) return <>{children}</>;

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 px-2 py-1 text-xs",
          className,
        )}
      >
        <span aria-hidden>🔒</span>
        <span className="text-amber-800">Diblokir — consent {purpose} belum aktif</span>
        {onRequestConsent ? (
          <button
            type="button"
            onClick={onRequestConsent}
            className="font-medium text-amber-900 underline hover:text-amber-700"
          >
            Minta
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-6 text-center",
        className,
      )}
      role="region"
      aria-label={`Konten ${purpose} diblokir karena belum ada consent wali`}
    >
      <span className="text-2xl" aria-hidden>
        🔒
      </span>
      <div className="text-sm font-medium text-amber-900">
        Diblokir oleh UU PDP Pasal 9
      </div>
      <div className="max-w-xs text-xs text-amber-800">
        Wali belum memberikan persetujuan untuk <strong>{purpose}</strong>. Kirim permintaan
        consent terlebih dahulu sebelum data dapat diproses atau ditampilkan.
      </div>
      {onRequestConsent ? (
        <button
          type="button"
          onClick={onRequestConsent}
          className="mt-1 rounded-md border border-amber-600 bg-amber-100/60 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
        >
          Kirim Permintaan Consent →
        </button>
      ) : null}
    </div>
  );
}
