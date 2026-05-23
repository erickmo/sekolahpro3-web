import { Link } from "react-router-dom";
import { Button } from "@sekolahpro/ui";
import { HERO, MODULES, STATS, TESTIMONIAL, PROCESS, FINAL_CTA } from "../data/landing-static";

export function Home() {
  return (
    <>
      <HeroSection />
      <ProofStrip />
      <ModulesSection />
      <StatsSection />
      <TestimonialSection />
      <ProcessSection />
      <FinalCTASection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/5 to-bg" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            {HERO.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold text-fg leading-tight tracking-tight">
            {HERO.line1}<br />
            {HERO.line2_text} <em className="not-italic font-serif italic text-brand">{HERO.line2_italic}</em><br />
            {HERO.line3}
          </h1>
          <p className="mt-6 text-lg text-muted-fg max-w-2xl leading-relaxed">
            {HERO.description}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to={HERO.cta_primary.url}>
              <Button size="lg" className="w-full sm:w-auto">{HERO.cta_primary.label}</Button>
            </Link>
            <Link to={HERO.cta_secondary.url}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">{HERO.cta_secondary.label}</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofStrip() {
  const items = ["Dipakai 120+ sekolah", "ISO-27001 ready", "Dukungan oncall WIB", "Dibangun di Indonesia"];
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-fg">
        {items.map((t, i) => (
          <span key={t} className="flex items-center gap-2">
            {i > 0 && <span className="w-1 h-1 rounded-full bg-muted-fg/40" aria-hidden />}
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

function ModulesSection() {
  return (
    <section id="modules" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand">— Modul</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold text-fg">
            Enam pilar, <em className="not-italic font-serif italic text-brand">satu pintu.</em>
          </h2>
          <p className="mt-4 text-muted-fg">
            Setiap modul mengikuti alur kerja nyata guru, tata usaha, dan kepala sekolah Indonesia.
            Berdaya sendiri, makin kuat bersama.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.key} className="group rounded-lg border border-border bg-bg p-6 hover:border-brand transition-colors">
              <div className="w-10 h-10 rounded-md bg-brand/10 text-brand flex items-center justify-center text-lg font-semibold">
                {m.title.charAt(0)}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-fg">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-fg leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="bg-fg text-bg py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-8 grid-cols-2 lg:grid-cols-4 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="text-4xl sm:text-5xl font-semibold tracking-tight">
              {s.value}
              {s.unit && <span className="text-2xl ml-1 opacity-70">{s.unit}</span>}
            </div>
            <div className="mt-2 text-sm text-bg/70 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-brand">— Kisah lapangan</p>
        <blockquote className="mt-6 text-2xl sm:text-3xl font-serif italic text-fg leading-snug">
          “{TESTIMONIAL.quote}”
        </blockquote>
        <footer className="mt-6 text-sm text-muted-fg">
          <div className="font-medium text-fg">{TESTIMONIAL.author}</div>
          <div>{TESTIMONIAL.role}</div>
        </footer>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand">— Proses</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold text-fg">
            Dari demo ke <em className="not-italic font-serif italic text-brand">operasional.</em>
          </h2>
          <p className="mt-4 text-muted-fg">
            Empat tahap terukur. Sekolah Anda tetap berjalan, kami yang menyesuaikan diri.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((step) => (
            <li key={step.number} className="rounded-lg border border-border bg-bg p-6">
              <div className="text-brand font-semibold text-sm">{step.number}</div>
              <h3 className="mt-2 text-lg font-semibold text-fg">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-fg leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-brand text-white p-8 sm:p-12 lg:p-16 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">
              {FINAL_CTA.title_main} <em className="not-italic font-serif italic">{FINAL_CTA.title_italic}</em>
            </h2>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-white/80">{FINAL_CTA.eyebrow}</p>
            <p className="mt-3 text-white/90 leading-relaxed">{FINAL_CTA.body}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link to={FINAL_CTA.primary.url}>
                <Button size="lg" className="w-full sm:w-auto bg-white text-brand hover:bg-white/90">
                  {FINAL_CTA.primary.label}
                </Button>
              </Link>
              <Link to={FINAL_CTA.secondary.url}>
                <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white border border-white/30 hover:bg-white/10">
                  {FINAL_CTA.secondary.label}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
