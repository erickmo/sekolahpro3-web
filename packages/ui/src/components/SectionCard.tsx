import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  title?: string | undefined;
  description?: string | undefined;
  action?: ReactNode | undefined;
  children: ReactNode;
  padded?: boolean | undefined;
  className?: string | undefined;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  padded = true,
  className,
}: Props) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-bg shadow-sm overflow-hidden",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-sm font-semibold text-fg">{title}</h3>
            ) : null}
            {description ? (
              <p className="text-xs text-muted-fg mt-0.5">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}
