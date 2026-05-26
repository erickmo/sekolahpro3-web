import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const styles = cva(
  "flex items-start gap-3 rounded-md border px-3 py-2.5 text-sm",
  {
    variants: {
      tone: {
        info: "border-info/30 bg-info/10 text-fg",
        success: "border-success/30 bg-success/10 text-fg",
        warning: "border-warning/30 bg-warning/10 text-fg",
        danger: "border-danger/40 bg-danger/10 text-fg",
        neutral: "border-border bg-muted/40 text-fg",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

interface AlertProps extends VariantProps<typeof styles> {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
  /** Jika diberikan, render tombol Tutup. */
  onDismiss?: () => void;
  /** Paksa role=status (polite) untuk notice non-urgent (success/info banner). */
  statusRole?: boolean;
}

/**
 * Inline notice block — pakai untuk error fetch, banner sukses, info compliance.
 * Default role=alert (assertive) supaya SR membacakan segera; `statusRole`
 * mengubah ke role=status (polite) untuk update non-urgent.
 */
export function Alert({ tone, title, children, className, onDismiss, statusRole }: AlertProps) {
  const role = statusRole ? "status" : "alert";
  return (
    <div role={role} className={cn(styles({ tone }), className)}>
      <div className="min-w-0 flex-1">
        {title ? <div className="mb-0.5 font-semibold leading-tight">{title}</div> : null}
        <div className="leading-snug">{children}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup"
          className="-mr-1 inline-flex h-6 w-6 items-center justify-center rounded text-muted-fg hover:bg-muted hover:text-fg"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
