import { useSite } from "../SiteContext";
import { Hero } from "../sections/Hero";
import { GaleriPreview } from "../sections/GaleriPreview";
import { PrestasiPreview } from "../sections/PrestasiPreview";
import { BeritaPreview } from "../sections/BeritaPreview";
import { ProfilSection } from "../sections/ProfilSection";
import { AgendaPreview } from "../sections/AgendaPreview";
import { ifEnabled, type TemplateDef } from "./types";

/** Alam: organic, photo-forward variant for green / adiwiyata / nature schools —
 *  rounded corners, mint soft-bg, green-glow shadow (see .tpl-alam in skins.css).
 *  Leads with galeri + prestasi to put environment photos first. Reuses the
 *  modern nav shape and the image hero. HomeBody is only the empty-layout
 *  fallback; the demo preset uses the fullbleed photo hero via the block engine. */
function AlamHome() {
  const site = useSite();
  return (
    <>
      <Hero variant="modern" />
      {ifEnabled(site, "galeri", <GaleriPreview />)}
      {ifEnabled(site, "prestasi", <PrestasiPreview />)}
      {ifEnabled(site, "berita", <BeritaPreview />)}
      {ifEnabled(site, "profil", <ProfilSection />)}
      {ifEnabled(site, "agenda", <AgendaPreview />)}
    </>
  );
}

export const alam: TemplateDef = {
  key: "alam",
  label: "Alam",
  themeClass: "tpl-alam",
  // Reuse the modern nav shape — alam is a rounded, image-led modern family.
  navVariant: "modern",
  HomeBody: AlamHome,
};
