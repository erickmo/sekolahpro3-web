import { useEffect, type ReactNode } from "react";
import { cn } from "../lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  footer?: ReactNode;
}

const SIZE_CLASS = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, description, size = "md", children, footer }: ModalProps) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          "relative bg-bg border border-border rounded-xl shadow-xl w-full max-h-[90vh] flex flex-col",
          SIZE_CLASS[size],
        )}
      >
        {(title || description) && (
          <div className="px-6 py-4 border-b border-border">
            {title && <h2 id="modal-title" className="text-lg font-semibold text-fg">{title}</h2>}
            {description && <p className="text-sm text-muted-fg mt-1">{description}</p>}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-3 border-t border-border bg-muted/30 rounded-b-xl flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
