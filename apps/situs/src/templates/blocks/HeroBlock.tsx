// Modern HeroBlock — the marquee block of every situs homepage. Renders one of
// five distinct personalities (split / centered / fullbleed / overlay /
// playful) over a SINGLE content contract: eyebrow + title + subtitle + dual
// CTA. Block-level overrides win over the school profil so the CMS can retitle a
// hero without touching the profile. All color flows from the per-tenant
// --situs-brand* CSS vars; radius/shadow come from the Task-13 skin tokens;
// entrance motion reuses the shared .situs-rise keyframe.
//
// Design intent (frontend-design skill): confident type scale, generous
// vertical rhythm, and layered depth (gradient washes + soft blur orbs) so the
// hero reads as designed rather than generic. Each variant commits to one idea
// — editorial split, refined centered, gradient fullbleed, cinematic overlay,
// toy-like playful — instead of timidly blending them.

import { Link } from "react-router-dom";
import { useSite } from "../../SiteContext";
import { DEFAULT_HERO_VARIANT, type HeroVariant } from "../../constants";
import { Container } from "../../sections/primitives";
import type { BlockProps } from "./registry";

/** Fallback secondary-CTA target when a label is set but no URL is configured. */
const SECONDARY_CTA_FALLBACK_URL = "/profil";
/** Fallback primary-CTA label/url when neither block nor profil supplies one. */
const PRIMARY_CTA_FALLBACK_LABEL = "Informasi PPDB";
const PRIMARY_CTA_FALLBACK_URL = "/ppdb";

interface HeroCtaProps {
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel?: string | undefined;
  secondaryUrl?: string | undefined;
  /** Center the CTA row (centered/playful variants). */
  center?: boolean;
  /** Render the secondary CTA on a dark backdrop (overlay/fullbleed). */
  onDark?: boolean;
  /** Pill-shaped, sticker-like CTAs for the playful variant. */
  playful?: boolean;
}

/**
 * Shared dual-CTA renderer so every hero variant emits an identical, accessible
 * primary + (optional) secondary action without duplicating link markup.
 * @param props - Resolved labels/urls plus per-variant layout flags.
 * @returns The CTA row, or just the primary action when no secondary label.
 */
function HeroCtas({ primaryLabel, primaryUrl, secondaryLabel, secondaryUrl, center, onDark, playful }: HeroCtaProps) {
  const shape = playful ? "situs-pill" : "situs-round";
  // On dark heroes the outline CTA uses a translucent white edge; on light
  // heroes it borrows the tenant border + ink so it stays on-brand.
  const secondaryStyle = onDark
    ? { borderColor: "rgba(255,255,255,0.55)", color: "var(--situs-brand-fg)" }
    : { borderColor: "var(--situs-border)", color: "var(--situs-ink)" };
  return (
    <div className={`mt-8 flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
      <Link
        to={primaryUrl}
        className={`situs-brand-bg ${shape} px-7 py-3.5 text-sm font-semibold shadow-lg transition duration-200 hover:-translate-y-0.5 hover:brightness-110`}
      >
        {primaryLabel}
      </Link>
      {secondaryLabel ? (
        <Link
          to={secondaryUrl || SECONDARY_CTA_FALLBACK_URL}
          className={`${shape} border-2 px-7 py-3.5 text-sm font-semibold backdrop-blur transition duration-200 hover:-translate-y-0.5 ${onDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
          style={secondaryStyle}
        >
          {secondaryLabel}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Render the homepage hero block.
 * @param block - Layout block; judul/subjudul/ctaLabel/ctaUrl override the
 *                school profil, `variant` selects the visual personality.
 * @returns A full-width hero <section> with an <h1>, lead copy, and dual CTA.
 */
export function HeroBlock({ block }: BlockProps) {
  const site = useSite();
  const p = site.profil;
  // When the block overrides the title, treat its subjudul as a custom eyebrow;
  // otherwise fall back to the profil eyebrow, then the tagline.
  const eyebrow = block.judul ? block.subjudul : (p.heroEyebrow ?? p.tagline);
  const judul = block.judul || p.heroJudul;
  const subjudul = block.subjudul || p.heroSubjudul;
  const primaryLabel = block.ctaLabel || p.heroCtaLabel || PRIMARY_CTA_FALLBACK_LABEL;
  const primaryUrl = block.ctaUrl || p.heroCtaUrl || PRIMARY_CTA_FALLBACK_URL;
  const secondaryLabel = p.heroCta2Label;
  const secondaryUrl = p.heroCta2Url;
  const variant = (block.variant as HeroVariant) || DEFAULT_HERO_VARIANT;
  const img = site.brand.heroImage;

  const eyebrowNode = eyebrow ? (
    <p className="situs-brand-text text-sm font-semibold uppercase tracking-[0.2em]">{eyebrow}</p>
  ) : null;

  if (variant === "centered") {
    // Refined minimal: tight measure, big centered headline, soft section bg.
    return (
      <section className="situs-section situs-soft-bg overflow-hidden">
        <Container className="situs-rise mx-auto max-w-3xl text-center">
          {eyebrowNode}
          <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl" style={{ color: "var(--situs-ink)" }}>
            {judul}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg" style={{ color: "var(--situs-muted)" }}>{subjudul}</p>
          <HeroCtas primaryLabel={primaryLabel} primaryUrl={primaryUrl} secondaryLabel={secondaryLabel} secondaryUrl={secondaryUrl} center />
        </Container>
      </section>
    );
  }

  if (variant === "fullbleed") {
    // Gradient maximalist: full brand-gradient wash + a soft blur orb for depth.
    return (
      <section
        className="situs-section relative isolate overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--situs-brand) 0%, var(--situs-brand-2) 100%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-30"
          style={{ background: "rgba(255,255,255,0.35)", filter: "blur(48px)" }}
        />
        <Container className="situs-rise relative max-w-3xl">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--situs-brand-fg)", opacity: 0.85 }}>{eyebrow}</p> : null}
          <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl" style={{ color: "var(--situs-brand-fg)" }}>{judul}</h1>
          <p className="mt-6 max-w-2xl text-lg" style={{ color: "var(--situs-brand-fg)", opacity: 0.9 }}>{subjudul}</p>
          <HeroCtas primaryLabel={primaryLabel} primaryUrl={primaryUrl} secondaryLabel={secondaryLabel} secondaryUrl={secondaryUrl} onDark />
        </Container>
      </section>
    );
  }

  if (variant === "overlay") {
    // Cinematic: hero image (or brand fill) under a bottom-up dark gradient.
    return (
      <section className="situs-section relative isolate flex min-h-[62vh] items-center overflow-hidden">
        {img ? (
          <img src={img} alt={site.nama} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        ) : (
          <div className="situs-brand-bg absolute inset-0 -z-10" />
        )}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.25) 100%)" }}
        />
        <Container className="situs-rise max-w-3xl">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">{eyebrow}</p> : null}
          <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">{judul}</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/90">{subjudul}</p>
          <HeroCtas primaryLabel={primaryLabel} primaryUrl={primaryUrl} secondaryLabel={secondaryLabel} secondaryUrl={secondaryUrl} onDark />
        </Container>
      </section>
    );
  }

  if (variant === "playful") {
    // Toy-like / kid-school: pill eyebrow, oversized rounding, friendly blobs,
    // sticker CTAs. Big rounded media card with a playful brand-soft backdrop.
    return (
      <section className="situs-section relative overflow-hidden" style={{ background: "rgba(var(--situs-brand-rgb),0.10)" }}>
        <div aria-hidden className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full opacity-40" style={{ background: "rgba(var(--situs-brand-rgb),0.25)" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 right-8 h-56 w-56 rounded-full opacity-30" style={{ background: "var(--situs-brand-2)" }} />
        <Container className="situs-rise relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            {eyebrow ? (
              <span className="situs-brand-bg situs-pill inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide shadow-sm">{eyebrow}</span>
            ) : null}
            <h1 className="font-round mt-4 text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl" style={{ color: "var(--situs-ink)" }}>{judul}</h1>
            <p className="mt-5 text-lg" style={{ color: "var(--situs-muted)" }}>{subjudul}</p>
            <HeroCtas primaryLabel={primaryLabel} primaryUrl={primaryUrl} secondaryLabel={secondaryLabel} secondaryUrl={secondaryUrl} playful />
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden shadow-2xl" style={{ borderRadius: "2rem", background: "rgba(var(--situs-brand-rgb),0.12)" }}>
            {img ? (
              <img src={img} alt={site.nama} className="h-full w-full object-cover" />
            ) : (
              <div className="situs-brand-bg flex h-full w-full items-center justify-center">
                <span className="font-round text-8xl font-extrabold opacity-90">{site.nama.slice(0, 1)}</span>
              </div>
            )}
          </div>
        </Container>
      </section>
    );
  }

  // split (default): editorial — copy left, branded media right.
  return (
    <section className="situs-section situs-soft-bg overflow-hidden">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="situs-rise">
          {eyebrowNode}
          <h1 className="mt-3 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl" style={{ color: "var(--situs-ink)" }}>{judul}</h1>
          <p className="mt-5 text-lg" style={{ color: "var(--situs-muted)" }}>{subjudul}</p>
          <HeroCtas primaryLabel={primaryLabel} primaryUrl={primaryUrl} secondaryLabel={secondaryLabel} secondaryUrl={secondaryUrl} />
        </div>
        <div
          className="situs-round-lg relative aspect-[4/3] w-full overflow-hidden shadow-2xl"
          style={{ background: "linear-gradient(135deg, rgba(var(--situs-brand-rgb),0.15), rgba(var(--situs-brand-rgb),0.04))" }}
        >
          {img ? (
            <img src={img} alt={site.nama} className="h-full w-full object-cover" />
          ) : (
            <div className="situs-brand-bg flex h-full w-full items-center justify-center">
              <span className="font-display text-7xl font-bold opacity-80">{site.nama.slice(0, 1)}</span>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
