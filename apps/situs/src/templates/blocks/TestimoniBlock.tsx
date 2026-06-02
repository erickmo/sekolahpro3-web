// TestimoniBlock — social-proof quote cards. Reads testimoni rows from the site
// context and renders each as a <figure> with the quote, an avatar (branded
// initials fallback), name, and role. Color via --situs-brand* vars; card chrome
// from the skin tokens.

import { useSite } from "../../SiteContext";
import { Container, ImageOrFallback, SectionHeading } from "../../sections/primitives";
import type { BlockProps } from "./registry";

/** Default heading when the block supplies none. */
const DEFAULT_TITLE = "Apa Kata Mereka";

/**
 * Render the testimoni grid.
 * @param block - Layout block; judul overrides the heading, subjudul the eyebrow.
 * @returns A section of quote cards, or null when no testimoni are configured.
 */
export function TestimoniBlock({ block }: BlockProps) {
  const { testimoni } = useSite();
  if (!testimoni.length) return null;
  return (
    <section className="situs-section situs-soft-bg">
      <Container>
        <SectionHeading eyebrow={block.subjudul ?? "Testimoni"} title={block.judul || DEFAULT_TITLE} align="center" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimoni.map((t, i) => (
            <figure key={`${t.nama}-${i}`} className="situs-card situs-round-lg flex flex-col p-7">
              <blockquote className="flex-1 text-base italic leading-relaxed" style={{ color: "var(--situs-ink)" }}>“{t.kutipan}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-full">
                  <ImageOrFallback src={t.foto} alt={t.nama} label={t.nama} ratio="aspect-square" />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--situs-ink)" }}>{t.nama}</div>
                  {t.peran ? <div className="text-xs" style={{ color: "var(--situs-muted)" }}>{t.peran}</div> : null}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
