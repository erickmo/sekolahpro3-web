import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "mega";
  /** Optional icon rendered in a tinted square inside the styled header. */
  icon?: ReactNode;
  /** Visual accent for the header gradient + icon tile. */
  tone?: "brand" | "violet" | "emerald" | "amber" | "rose" | "neutral";
  children: ReactNode;
  footer?: ReactNode;
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  // Mega: at least 50vw / 50vh, capped at 95vw / 90vh for sanity.
  mega: "w-[min(95vw,1280px)] min-w-[50vw] min-h-[50vh] max-h-[90vh] max-w-none",
};

const TONE_HEADER: Record<NonNullable<ModalProps["tone"]>, string> = {
  brand: "from-brand/10 via-bg to-violet-500/10",
  violet: "from-violet-500/10 via-bg to-fuchsia-500/10",
  emerald: "from-emerald-500/10 via-bg to-teal-500/10",
  amber: "from-amber-500/10 via-bg to-orange-500/10",
  rose: "from-rose-500/10 via-bg to-pink-500/10",
  neutral: "from-muted via-bg to-muted",
};

const TONE_ICON: Record<NonNullable<ModalProps["tone"]>, string> = {
  brand: "bg-brand/15 text-brand ring-brand/20",
  violet: "bg-violet-500/15 text-violet-600 ring-violet-500/20",
  emerald: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/20",
  amber: "bg-amber-500/15 text-amber-700 ring-amber-500/20",
  rose: "bg-rose-500/15 text-rose-600 ring-rose-500/20",
  neutral: "bg-muted text-fg ring-border",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  icon,
  tone = "brand",
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const hasHeader = !!(title || description || icon);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 pb-4 sm:pt-20">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={cn(
          "relative bg-bg border border-border rounded-xl shadow-xl w-full flex flex-col",
          size === "mega" ? "" : "max-h-[calc(100vh-6rem)]",
          SIZE_CLASS[size],
        )}
      >
        {hasHeader && (
          <div
            className={cn(
              "relative px-6 py-4 border-b border-border rounded-t-xl",
              "bg-gradient-to-br",
              TONE_HEADER[tone],
            )}
          >
            <button
              type="button"
              aria-label="Tutup"
              onClick={onClose}
              className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-fg hover:bg-muted hover:text-fg transition"
            >
              <span aria-hidden>×</span>
            </button>
            <div className="flex items-start gap-3 pr-8">
              {icon && (
                <span
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1",
                    TONE_ICON[tone],
                  )}
                >
                  <span className="h-5 w-5">{icon}</span>
                </span>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <h2 id="modal-title" className="text-lg font-semibold text-fg leading-tight">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-muted-fg mt-1">{description}</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-3 border-t border-border bg-muted/30 rounded-b-xl flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
