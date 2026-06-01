import { useSite } from "../SiteContext";
import { Hero } from "../sections/Hero";
import { GaleriPreview } from "../sections/GaleriPreview";
import { PrestasiPreview } from "../sections/PrestasiPreview";
import { BeritaPreview } from "../sections/BeritaPreview";
import { AgendaPreview } from "../sections/AgendaPreview";
import { PpdbPreview } from "../sections/PpdbPreview";
import { ProfilSection } from "../sections/ProfilSection";
import { ifEnabled, type TemplateDef } from "./types";

/** Ceria: playful, rounded, visual-forward — for TK/SD; gallery + prestasi up top. */
function CeriaHome() {
  const site = useSite();
  return (
    <>
      <Hero variant="ceria" />
      {ifEnabled(site, "galeri", <GaleriPreview />)}
      {ifEnabled(site, "prestasi", <PrestasiPreview />)}
      {ifEnabled(site, "berita", <BeritaPreview />)}
      {ifEnabled(site, "agenda", <AgendaPreview />)}
      {ifEnabled(site, "ppdb", <PpdbPreview />)}
      {ifEnabled(site, "profil", <ProfilSection />)}
    </>
  );
}

export const ceria: TemplateDef = {
  key: "ceria",
  label: "Ceria",
  themeClass: "tpl-ceria",
  navVariant: "ceria",
  HomeBody: CeriaHome,
};
