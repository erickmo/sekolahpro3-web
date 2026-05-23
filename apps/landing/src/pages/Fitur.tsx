import { Link } from "react-router-dom";
import { Button } from "@sekolahpro/ui";
import { useFiturContent, type FiturContent, type PillarDetail } from "../lib/fitur";

export function Fitur() {
  const { hero, cta, pillars } = useFiturContent();
  return (
    <>
      <FiturHero hero={hero} />
      {pillars.map((p, i) => (
        <PillarSection key={p.key} pillar={p} reverse={i % 2 === 1} />
      ))}
      <FiturCTA cta={cta} />
    </>
  );
}

function FiturHero({ hero }: { hero: FiturContent["hero"] }) {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <p className="text-sm font-medium text-brand">{hero.eyebrow}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold text-fg leading-tight max-w-3xl">
          {hero.title_main}{" "}
          <em className="not-italic font-serif italic text-brand">{hero.title_italic}</em>
        </h1>
        <p className="mt-4 text-lg text-muted-fg max-w-2xl">{hero.lead}</p>
      </div>
    </section>
  );
}

function PillarSection({ pillar, reverse }: { pillar: PillarDetail; reverse: boolean }) {
  return (
    <section className="py-16 sm:py-20 border-b border-border last:border-b-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`grid gap-10 lg:grid-cols-2 lg:items-start ${reverse ? "lg:[&>div:first-child]:order-2" : ""}`}>
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold uppercase tracking-wide">
              {pillar.title}
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-fg leading-tight">
              {pillar.tagline}
            </h2>
            <p className="mt-4 text-muted-fg leading-relaxed">
              {pillar.description}
            </p>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-muted-fg">Untuk peran</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {pillar.users.map((u) => (
                  <span key={u} className="text-xs px-2.5 py-1 rounded-md bg-muted text-fg/80">
                    {u}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-muted-fg">Alur kerja</p>
              <ol className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg/80">
                {pillar.workflow.map((w, i) => (
                  <li key={w} className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md border border-border bg-bg">{w}</span>
                    {i < pillar.workflow.length - 1 && <span className="text-muted-fg" aria-hidden>→</span>}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <ul className="space-y-3">
            {pillar.features.map((f) => (
              <li key={f} className="flex gap-3 items-start">
                <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand" aria-hidden />
                <span className="text-fg/90 leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FiturCTA({ cta }: { cta: FiturContent["cta"] }) {
  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold text-fg">{cta.title}</h2>
        <p className="mt-4 text-muted-fg">{cta.body}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={cta.primary.url}>
            <Button size="lg" className="w-full sm:w-auto">{cta.primary.label}</Button>
          </Link>
          <Link to={cta.secondary.url}>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">{cta.secondary.label}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
