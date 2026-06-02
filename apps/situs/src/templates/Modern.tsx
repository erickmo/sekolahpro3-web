import { useSite } from "../SiteContext";
import { Hero } from "../sections/Hero";
import { BeritaPreview } from "../sections/BeritaPreview";
import { PpdbPreview } from "../sections/PpdbPreview";
import { PrestasiPreview } from "../sections/PrestasiPreview";
import { ProfilSection } from "../sections/ProfilSection";
import { GaleriPreview } from "../sections/GaleriPreview";
import { AgendaPreview } from "../sections/AgendaPreview";
import { ifEnabled, type TemplateDef } from "./types";

/** Modern: clean, marketing-forward — news + PPDB up top to drive conversion. */
function ModernHome() {
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

export const modern: TemplateDef = {
  key: "modern",
  label: "Modern",
  themeClass: "tpl-modern",
  navVariant: "modern",
  HomeBody: ModernHome,
};
