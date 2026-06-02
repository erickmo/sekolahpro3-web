// CtaBlock — a bold closing call-to-action panel. Falls back to the school name
// + profil PPDB CTA when the block supplies no copy, so a CMS author can drop it
// in with zero config. The brand-gradient panel + inverted white button create
// the visual punch. Color via --situs-brand* vars; rounding/shadow from tokens.

import { Link } from "react-router-dom";
import { useSite } from "../../SiteContext";
import { Container } from "../../sections/primitives";
import { BRAND_GRADIENT } from "../../theme";
import type { BlockProps } from "./registry";

/** Fallback primary CTA label/url when neither block nor profil supplies one. */
const CTA_FALLBACK_LABEL = "Informasi PPDB";
const CTA_FALLBACK_URL = "/ppdb";

/**
 * Render the closing CTA panel.
 * @param block - Layout block; judul/subjudul/ctaLabel/ctaUrl override defaults.
 * @returns A gradient panel with a heading and a single inverted CTA button.
 */
export function CtaBlock({ block }: BlockProps) {
  const site = useSite();
  const judul = block.judul || `Bergabung dengan ${site.nama}`;
  const label = block.ctaLabel || site.profil.heroCtaLabel || CTA_FALLBACK_LABEL;
  const url = block.ctaUrl || site.profil.heroCtaUrl || CTA_FALLBACK_URL;
  return (
    <section className="situs-section">
      <Container>
        <div className="situs-round-lg relative overflow-hidden p-10 text-center shadow-2xl sm:p-14" style={{ background: BRAND_GRADIENT }}>
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25" style={{ background: "rgba(255,255,255,0.4)", filter: "blur(36px)" }} />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--situs-brand-fg)" }}>{judul}</h2>
          {block.subjudul ? (
            <p className="relative mx-auto mt-3 max-w-xl text-base" style={{ color: "var(--situs-brand-fg)", opacity: 0.9 }}>{block.subjudul}</p>
          ) : null}
          <Link
            to={url}
            className="situs-round relative mt-8 inline-block bg-white px-8 py-3.5 text-sm font-bold shadow-lg transition duration-200 hover:-translate-y-0.5 hover:brightness-95"
            style={{ color: "var(--situs-brand)" }}
          >
            {label}
          </Link>
        </div>
      </Container>
    </section>
  );
}
