import { useSite } from "../SiteContext";
import { Hero } from "../sections/Hero";
import { ProfilSection } from "../sections/ProfilSection";
import { PrestasiPreview } from "../sections/PrestasiPreview";
import { BeritaPreview } from "../sections/BeritaPreview";
import { AgendaPreview } from "../sections/AgendaPreview";
import { GaleriPreview } from "../sections/GaleriPreview";
import { PpdbPreview } from "../sections/PpdbPreview";
import { ifEnabled, type TemplateDef } from "./types";

/** Klasik: formal, academic, serif headings — order leads with identity. */
function KlasikHome() {
  const site = useSite();
  return (
    <>
      <Hero variant="klasik" />
      {ifEnabled(site, "profil", <ProfilSection />)}
      {ifEnabled(site, "prestasi", <PrestasiPreview />)}
      {ifEnabled(site, "berita", <BeritaPreview />)}
      {ifEnabled(site, "agenda", <AgendaPreview />)}
      {ifEnabled(site, "galeri", <GaleriPreview />)}
      {ifEnabled(site, "ppdb", <PpdbPreview />)}
    </>
  );
}

export const klasik: TemplateDef = {
  key: "klasik",
  label: "Klasik",
  themeClass: "tpl-klasik",
  navVariant: "klasik",
  HomeBody: KlasikHome,
};
