import { Link } from "react-router-dom";
import { useHomepageContent, type HomepageContent } from "../lib/homepage";
import { useSiteContent } from "../lib/site";

export function Home() {
  const c = useHomepageContent();
  const site = useSiteContent();
  return (
    <>
      <HeroSection c={c} />
      <ProofStrip items={site.proof_items.map((p) => p.label)} />
      <ModulesSection c={c} />
      <StatsSection c={c} />
      <TestimonialSection c={c} />
      <ProcessSection c={c} />
      <FinalCTASection c={c} />
    </>
  );
}

/* ───────────────────────── HERO ───────────────────────── */
function HeroSection({ c }: { c: HomepageContent }) {
  const { hero } = c;
  const now = new Date();
  const issue = `Vol. ${now.getFullYear() - 2023} — No. ${now.getMonth() + 1}`;

  return (
    <section className="relative overflow-hidden">
      {/* Decorative corner hatch */}
      <div className="hatch absolute -top-10 -left-10 w-80 h-80 rotate-6 opacity-60 pointer-events-none" aria-hidden />
      <div
        className="absolute right-0 top-1/3 w-[40rem] h-[40rem] rounded-full pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--color-brand) / 0.18), transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 lg:pt-24 pb-20 lg:pb-32">
        {/* Masthead row */}
        <div className="flex items-center justify-between border-y border-fg/20 py-3 mb-14 rise rise-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg/65">
            {issue} · Edisi Sekolah Modern
          </span>
          <span className="hidden md:block font-display italic text-fg/65">
            — Untuk para pendidik Nusantara —
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">
            {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          <div className="lg:col-span-8">
            <p className="rule-label rise rise-1">{hero.eyebrow}</p>
            <h1 className="mt-6 font-display font-medium tracking-tight text-fg text-[2.6rem] sm:text-6xl lg:text-[5.4rem] leading-[0.95]">
              <span className="block rise rise-2">{hero.line1}</span>
              <span className="block rise rise-3">
                {hero.line2_text}{" "}
                <em className="not-italic italic text-brand">
                  <span className="ink-underline ink-sweep">{hero.line2_italic}</span>
                </em>
              </span>
              <span className="block rise rise-4">{hero.line3}</span>
            </h1>
          </div>

          <aside className="lg:col-span-4 lg:pt-32 rise rise-5">
            <div className="relative border-l border-fg/25 pl-6 lg:pl-8">
              <span
                className="absolute -left-px top-0 w-[3px] h-16 bg-brand"
                aria-hidden
              />
              <p className="font-display italic text-xl text-fg/80 leading-relaxed">
                {hero.description}
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  to={hero.cta_primary.url}
                  className="group relative inline-flex items-center justify-between gap-4 bg-fg text-bg px-6 py-4 hover:bg-brand transition-colors"
                >
                  <span className="font-medium">{hero.cta_primary.label}</span>
                  <span className="font-display italic text-2xl transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  to={hero.cta_secondary.url}
                  className="group inline-flex items-center justify-between gap-4 border border-fg/30 px-6 py-4 hover:border-brand hover:text-brand transition-colors"
                >
                  <span className="font-medium">{hero.cta_secondary.label}</span>
                  <span className="font-mono text-xs uppercase tracking-widest">demo</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── PROOF STRIP (marquee) ───────────────────────── */
function ProofStrip({ items }: { items: string[] }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <section className="border-y border-fg/20 bg-fg text-bg overflow-hidden">
      <div className="relative py-5">
        <div className="flex marquee-track w-max gap-12 whitespace-nowrap">
          {doubled.map((t, i) => (
            <span key={`${t}-${i}`} className="flex items-center gap-6 font-display text-lg">
              <span className="text-brand italic">§</span>
              <span className="tracking-wide">{t}</span>
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-fg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-fg to-transparent" />
      </div>
    </section>
  );
}

/* ───────────────────────── MODULES ───────────────────────── */
function ModulesSection({ c }: { c: HomepageContent }) {
  return (
    <section id="modules" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          <div className="lg:col-span-4">
            <p className="rule-label">Modul · 06 Pilar</p>
            <h2 className="mt-5 font-display font-medium tracking-tight text-fg text-4xl sm:text-5xl lg:text-6xl leading-[1]">
              Enam pilar,
              <br />
              <em className="not-italic italic text-brand">satu pintu.</em>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-10">
            <p className="font-display italic text-xl text-fg/75 leading-relaxed">
              Setiap modul mengikuti alur kerja nyata guru, tata usaha, dan kepala sekolah Indonesia.
              <span className="text-brand"> Berdaya sendiri, makin kuat bersama.</span>
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 border-t border-fg/20">
          {c.modules.map((m, i) => {
            const n = String(i + 1).padStart(2, "0");
            const isLastRow = i >= c.modules.length - (c.modules.length % 3 || 3);
            return (
              <article
                key={m.key}
                className={[
                  "group relative p-8 lg:p-10 transition-colors duration-300",
                  "border-b border-fg/20",
                  i % 3 !== 2 ? "lg:border-r lg:border-fg/20" : "",
                  isLastRow ? "" : "",
                  "hover:bg-fg hover:text-bg",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <span className="num-display text-5xl text-brand">{n}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-fg/45 group-hover:text-bg/55 transition-colors">
                    Modul
                  </span>
                </div>
                <h3 className="mt-10 font-display text-2xl font-medium tracking-tight leading-tight">
                  {m.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-fg/70 group-hover:text-bg/75 transition-colors">
                  {m.description}
                </p>
                <div className="mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Pelajari</span>
                  <span className="font-display italic text-base">→</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── STATS ───────────────────────── */
function StatsSection({ c }: { c: HomepageContent }) {
  const [hero, ...rest] = c.stats;
  if (!hero) return null;
  return (
    <section className="relative bg-fg text-bg overflow-hidden">
      <div className="hatch absolute inset-0 opacity-20" aria-hidden />
      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            <p className="rule-label" style={{ color: "hsl(var(--color-bg) / 0.55)" }}>
              Angka berbicara
            </p>
            <div className="mt-6 flex items-baseline gap-4">
              <span className="num-display text-[7rem] sm:text-[10rem] lg:text-[13rem] leading-[0.85] text-brand">
                {hero.value}
              </span>
              {hero.unit && (
                <span className="num-display text-4xl lg:text-6xl text-bg/70">{hero.unit}</span>
              )}
            </div>
            <div className="mt-4 font-display italic text-xl text-bg/80 max-w-md">
              {hero.label}
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6">
            {rest.map((s) => (
              <div key={s.label} className="border-t border-bg/25 pt-5">
                <div className="num-display text-5xl lg:text-6xl">
                  {s.value}
                  {s.unit && <span className="text-2xl ml-1 text-bg/60">{s.unit}</span>}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bg/65">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── TESTIMONIAL ───────────────────────── */
function TestimonialSection({ c }: { c: HomepageContent }) {
  const { testimonial } = c;
  return (
    <section className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-4xl px-6 lg:px-10 relative">
        <span
          aria-hidden
          className="absolute -top-6 -left-2 lg:-left-12 font-display italic text-brand/25 text-[14rem] leading-none select-none pointer-events-none"
        >
          “
        </span>
        <p className="rule-label relative">Kisah lapangan</p>

        <blockquote className="relative mt-8 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.15] text-fg dropcap">
          {testimonial.quote}
        </blockquote>

        <footer className="mt-10 flex items-center gap-5 relative">
          <span className="block w-16 h-px bg-brand" aria-hidden />
          <div>
            <div className="font-display italic text-xl text-fg">{testimonial.author}</div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-fg/55 mt-1">
              {testimonial.role}
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}

/* ───────────────────────── PROCESS ───────────────────────── */
function ProcessSection({ c }: { c: HomepageContent }) {
  return (
    <section className="relative bg-muted/60 py-24 sm:py-32 border-y border-fg/15">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          <div className="lg:col-span-6">
            <p className="rule-label">Proses · 04 Tahap</p>
            <h2 className="mt-5 font-display font-medium tracking-tight text-fg text-4xl sm:text-5xl lg:text-6xl leading-[1]">
              Dari demo ke{" "}
              <em className="not-italic italic text-brand">operasional.</em>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-6">
            <p className="font-display italic text-xl text-fg/75 leading-relaxed">
              Empat tahap terukur. Sekolah Anda tetap berjalan, kami yang menyesuaikan diri.
            </p>
          </div>
        </div>

        <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {c.process.map((step, i) => (
            <li
              key={step.number}
              className="group relative bg-bg p-7 shadow-paper border border-fg/10 hover:border-brand transition-colors"
              style={{ transform: `translateY(${(i % 2) * 18}px)` }}
            >
              <div className="flex items-baseline justify-between">
                <span className="num-display text-6xl text-brand">{step.number}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-fg/45">
                  Tahap
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-medium leading-tight">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg/70">{step.description}</p>
              <span
                className="absolute -bottom-px left-0 h-[2px] bg-brand origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ right: 0 }}
                aria-hidden
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────── FINAL CTA ───────────────────────── */
function FinalCTASection({ c }: { c: HomepageContent }) {
  const { final_cta } = c;
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="relative bg-fg text-bg overflow-hidden">
          <div
            className="absolute -left-32 -bottom-32 w-[36rem] h-[36rem] rounded-full opacity-40 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, hsl(var(--color-brand)) 0%, transparent 65%)",
              filter: "blur(20px)",
            }}
            aria-hidden
          />
          <div className="hatch absolute inset-0 opacity-15 pointer-events-none" aria-hidden />

          <div className="relative grid lg:grid-cols-12 gap-10 p-10 sm:p-16 lg:p-20">
            <div className="lg:col-span-7">
              <p className="rule-label" style={{ color: "hsl(var(--color-bg) / 0.6)" }}>
                {final_cta.eyebrow}
              </p>
              <h2 className="mt-6 font-display font-medium tracking-tight text-4xl sm:text-5xl lg:text-7xl leading-[0.98]">
                {final_cta.title_main}{" "}
                <em className="not-italic italic text-brand block sm:inline">
                  {final_cta.title_italic}
                </em>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:pt-6 border-l border-bg/20 lg:pl-10">
              <p className="font-display italic text-xl text-bg/85 leading-relaxed">
                {final_cta.body}
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  to={final_cta.primary.url}
                  className="group inline-flex items-center justify-between bg-brand text-bg px-6 py-4 hover:bg-bg hover:text-fg transition-colors"
                >
                  <span className="font-medium">{final_cta.primary.label}</span>
                  <span className="font-display italic text-2xl transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  to={final_cta.secondary.url}
                  className="group inline-flex items-center justify-between border border-bg/40 px-6 py-4 hover:border-brand hover:text-brand transition-colors"
                >
                  <span className="font-medium">{final_cta.secondary.label}</span>
                  <span className="font-mono text-xs uppercase tracking-widest">info</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
