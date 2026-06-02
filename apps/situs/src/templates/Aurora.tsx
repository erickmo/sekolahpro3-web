import { useSite } from "../SiteContext";
import { Hero } from "../sections/Hero";
import { BeritaPreview } from "../sections/BeritaPreview";
import { PpdbPreview } from "../sections/PpdbPreview";
import { PrestasiPreview } from "../sections/PrestasiPreview";
import { ProfilSection } from "../sections/ProfilSection";
import { GaleriPreview } from "../sections/GaleriPreview";
import { AgendaPreview } from "../sections/AgendaPreview";
import { ifEnabled, type TemplateDef } from "./types";

/** Aurora: soft, gradient-forward modern variant — large radius + airy cards.
 *  Shares Modern's conversion-led composition; the distinct look comes from
 *  the .tpl-aurora skin (skins.css). HomeBody is only the empty-layout fallback;
 *  schools with a layout_blocks payload render via the block engine instead. */
function AuroraHome() {
  const site = useSite();
  return (
    <>
      <Hero variant="modern" />
      {ifEnabled(site, "berita", <BeritaPreview />)}
      {ifEnabled(site, "ppdb", <PpdbPreview />)}
      {ifEnabled(site, "prestasi", <PrestasiPreview />)}
      {ifEnabled(site, "profil", <ProfilSection />)}
      {ifEnabled(site, "galeri", <GaleriPreview />)}
      {ifEnabled(site, "agenda", <AgendaPreview />)}
    </>
  );
}

export const aurora: TemplateDef = {
  key: "aurora",
  label: "Aurora",
  themeClass: "tpl-aurora",
  // Reuse the modern nav shape — aurora is a modern-family skin.
  navVariant: "modern",
  HomeBody: AuroraHome,
};
