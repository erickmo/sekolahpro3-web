// StatistikBlock — at-a-glance numbers on a full-width brand-gradient band.
// Reads statistik rows from the site context. Oversized numerals carry the
// hierarchy; the gradient (brand → brand-2) supplies depth. All color via the
// per-tenant --situs-brand* vars.

import { useSite } from "../../SiteContext";
import { Container } from "../../sections/primitives";
import { BRAND_GRADIENT } from "../../theme";
import type { BlockProps } from "./registry";

/**
 * Render the statistik band.
 * @param block - Layout block; optional judul renders as a centered heading.
 * @returns A gradient stat band, or null when no statistik are configured.
 */
export function StatistikBlock({ block }: BlockProps) {
  const { statistik } = useSite();
  if (!statistik.length) return null;
  return (
    <section className="situs-section" style={{ background: BRAND_GRADIENT }}>
      <Container>
        {block.judul ? (
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl" style={{ color: "var(--situs-brand-fg)" }}>{block.judul}</h2>
        ) : null}
        <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {statistik.map((s, i) => (
            <div key={`${s.label}-${i}`}>
              <div className="text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--situs-brand-fg)" }}>
                {s.nilai}
                {s.satuan ? <span className="ml-1 text-xl font-semibold opacity-80">{s.satuan}</span> : null}
              </div>
              <div className="mt-2 text-sm font-medium uppercase tracking-wide" style={{ color: "var(--situs-brand-fg)", opacity: 0.85 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
