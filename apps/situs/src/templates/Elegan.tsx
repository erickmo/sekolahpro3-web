import { useSite } from "../SiteContext";
import { Hero } from "../sections/Hero";
import { ProfilSection } from "../sections/ProfilSection";
import { PrestasiPreview } from "../sections/PrestasiPreview";
import { BeritaPreview } from "../sections/BeritaPreview";
import { GaleriPreview } from "../sections/GaleriPreview";
import { AgendaPreview } from "../sections/AgendaPreview";
import { ifEnabled, type TemplateDef } from "./types";

/** Elegan: editorial, prestige variant — serif display headings, generous
 *  whitespace, refined soft shadow (see .tpl-elegan in skins.css). For private /
 *  international schools. Leads with profil + prestasi to read like a brochure.
 *  Reuses the klasik nav shape and the split (image) hero. HomeBody is only the
 *  empty-layout fallback; schools with a layout_blocks payload render via the
 *  block engine instead. */
function EleganHome() {
  const site = useSite();
  return (
    <>
      <Hero variant="modern" />
      {ifEnabled(site, "profil", <ProfilSection />)}
      {ifEnabled(site, "prestasi", <PrestasiPreview />)}
      {ifEnabled(site, "berita", <BeritaPreview />)}
      {ifEnabled(site, "galeri", <GaleriPreview />)}
      {ifEnabled(site, "agenda", <AgendaPreview />)}
    </>
  );
}

export const elegan: TemplateDef = {
  key: "elegan",
  label: "Elegan",
  themeClass: "tpl-elegan",
  // Reuse the klasik nav shape — elegan shares its formal, serif personality.
  navVariant: "klasik",
  HomeBody: EleganHome,
};
