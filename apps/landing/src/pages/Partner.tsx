import { Link } from "react-router-dom";
import { Button } from "@sekolahpro/ui";
import {
  PARTNER_SCHOOLS,
  PARTNER_ORGS,
  CASE_STUDIES,
} from "../data/partner-static";

export function Partner() {
  return (
    <>
      <PartnerHero />
      <SchoolGrid />
      <CaseStudies />
      <OrgLogos />
      <PartnerCTA />
    </>
  );
}

function PartnerHero() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <p className="text-sm font-medium text-brand">— Partner</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold text-fg leading-tight max-w-3xl">
          Dipercaya sekolah di <em className="not-italic font-serif italic text-brand">18 provinsi.</em>
        </h1>
        <p className="mt-4 text-lg text-muted-fg max-w-2xl">
          Dari SD swasta kecil sampai SMK besar — kami tumbuh bersama sekolah Indonesia.
        </p>
      </div>
    </section>
  );
}

function SchoolGrid() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-fg">Sekolah pengguna</h2>
          <p className="text-sm text-muted-fg">Beberapa sekolah yang sudah berjalan dengan SekolahPro.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PARTNER_SCHOOLS.map((s) => (
            <div key={s.name} className="rounded-lg border border-border bg-bg p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-brand/10 text-brand flex items-center justify-center text-sm font-semibold">
                  {s.jenjang}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-fg truncate">{s.name}</h3>
                  <p className="text-xs text-muted-fg truncate">{s.city}, {s.province}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-fg">Siswa</dt>
                  <dd className="font-medium text-fg">{s.students.toLocaleString("id-ID")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-fg">Bergabung</dt>
                  <dd className="font-medium text-fg">{s.since}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudies() {
  return (
    <section className="py-16 sm:py-20 border-y border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-brand">— Studi kasus</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-semibold text-fg max-w-2xl">
          Hasil yang bisa <em className="not-italic font-serif italic text-brand">diukur.</em>
        </h2>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {CASE_STUDIES.map((c) => (
            <article key={c.school} className="rounded-lg border border-border bg-bg p-6 sm:p-8">
              <div className="text-xs uppercase tracking-wide text-muted-fg">{c.jenjang}</div>
              <h3 className="mt-1 text-xl font-semibold text-fg">{c.school}</h3>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-muted-fg">Tantangan</p>
                <p className="mt-1 text-fg/90 leading-relaxed">{c.challenge}</p>
              </div>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-muted-fg">Hasil</p>
                <p className="mt-1 text-fg/90 leading-relaxed">{c.outcome}</p>
              </div>

              <div className="mt-6 rounded-md bg-brand/5 border border-brand/20 p-4">
                <div className="text-3xl font-semibold text-brand">{c.metric.value}</div>
                <div className="text-xs text-fg/70 mt-1">{c.metric.label}</div>
              </div>

              <blockquote className="mt-6 text-fg/85 font-serif italic leading-relaxed border-l-2 border-brand pl-4">
                “{c.quote}”
              </blockquote>
              <div className="mt-2 text-xs text-muted-fg">{c.quote_author}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function OrgLogos() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-fg">Ekosistem mitra</h2>
        <p className="mt-2 text-muted-fg max-w-2xl">
          Kami berkolaborasi dengan penyedia layanan tepercaya untuk pembayaran, komunikasi, dan integrasi pemerintah.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARTNER_ORGS.map((o) => (
            <div key={o.name} className="rounded-lg border border-border bg-bg p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-muted text-fg flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {o.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-fg">{o.name}</h3>
                <p className="text-sm text-muted-fg mt-1">{o.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnerCTA() {
  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold text-fg">
          Sekolah Anda bisa jadi cerita berikutnya.
        </h2>
        <p className="mt-4 text-muted-fg">
          Tidak perlu sekolah besar untuk mulai. Banyak partner kami mulai dari satu modul dan tumbuh dari sana.
        </p>
        <div className="mt-8">
          <Link to="/kontak?utm=partner">
            <Button size="lg">Mulai Konsultasi</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
