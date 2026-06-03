import { useSite } from "../SiteContext";
import { Hero } from "../sections/Hero";
import { PrestasiPreview } from "../sections/PrestasiPreview";
import { BeritaPreview } from "../sections/BeritaPreview";
import { PpdbPreview } from "../sections/PpdbPreview";
import { ProfilSection } from "../sections/ProfilSection";
import { AgendaPreview } from "../sections/AgendaPreview";
import { ifEnabled, type TemplateDef } from "./types";

/** Akademik: structured, data-led variant for SMA/SMK/college-prep — bold sans,
 *  tight tracking, bordered sections (see .tpl-akademik in skins.css). Leads with
 *  prestasi + berita + ppdb to foreground achievements and admissions. Reuses the
 *  modern nav shape and the split (image + CTA) hero. HomeBody is only the
 *  empty-layout fallback; the demo preset surfaces a statistik row via the block
 *  engine, which the section-component fallback cannot render. */
function AkademikHome() {
  const site = useSite();
  return (
    <>
      <Hero variant="modern" />
      {ifEnabled(site, "prestasi", <PrestasiPreview />)}
      {ifEnabled(site, "berita", <BeritaPreview />)}
      {ifEnabled(site, "ppdb", <PpdbPreview />)}
      {ifEnabled(site, "profil", <ProfilSection />)}
      {ifEnabled(site, "agenda", <AgendaPreview />)}
    </>
  );
}

export const akademik: TemplateDef = {
  key: "akademik",
  label: "Akademik",
  themeClass: "tpl-akademik",
  // Reuse the modern nav shape — akademik is a sans-serif, structured family.
  navVariant: "modern",
  HomeBody: AkademikHome,
};
