// Small shared building blocks used across sections + templates. Kept tiny so
// templates compose rather than re-implement.

import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
}) {
  const alignCls = align === "center" ? "text-center mx-auto" : "";
  return (
    <div className={`max-w-2xl ${alignCls}`}>
      {eyebrow ? (
        <p className="situs-brand-text mb-2 text-xs font-semibold uppercase tracking-widest">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--situs-ink)" }}>
        {title}
      </h2>
      {lead ? <p className="mt-3 text-base" style={{ color: "var(--situs-muted)" }}>{lead}</p> : null}
    </div>
  );
}

/** Initials from a name, for image fallbacks. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** An image that falls back to a branded initials block when src is empty. */
export function ImageOrFallback({
  src,
  alt,
  label,
  className = "",
  ratio = "aspect-[4/3]",
}: {
  src: string | null | undefined;
  alt: string;
  label: string;
  className?: string;
  ratio?: string;
}) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={`${ratio} w-full object-cover ${className}`} />;
  }
  return (
    <div
      className={`${ratio} situs-brand-soft flex w-full items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <span className="situs-brand-text font-display text-3xl font-bold opacity-60">{initials(label)}</span>
    </div>
  );
}

export function Spinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <span className="situs-brand-border h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
      <span className="text-sm" style={{ color: "var(--situs-muted)" }}>{label}</span>
    </div>
  );
}
