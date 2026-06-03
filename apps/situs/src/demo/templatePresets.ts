import type { TemplateKey } from "../constants";
import type { LayoutBlock, SiteData, SiteTheme } from "../types";

// Client-side mirror of each Template Situs record's settings (hero_variant,
// section_style, default_layout) from the backend fixtures. Used only by the
// demo switcher to preview a template's full look without a backend round-trip.
// radius/font/shadow are intentionally left blank so the template's skin class
// (.tpl-<key> in skins.css) drives them — matching live rendering.

const block = (tipe: LayoutBlock["tipe"], variant: string): LayoutBlock => ({
  tipe,
  variant,
  aktif: true,
});

const theme = (heroVariant: string, sectionStyle: SiteTheme["sectionStyle"]): SiteTheme => ({
  heroVariant,
  sectionStyle,
  radius: "",
  fontHeading: "",
  fontBody: "",
  shadow: "",
});

export interface TemplatePreset {
  theme: SiteTheme;
  layoutBlocks: LayoutBlock[];
}

export const TEMPLATE_PRESETS: Record<TemplateKey, TemplatePreset> = {
  klasik: {
    theme: theme("split", "bordered"),
    layoutBlocks: [
      block("hero", "split"),
      block("keunggulan", "grid"),
      block("profil", "default"),
      block("berita", "list"),
      block("agenda", "default"),
      block("prestasi", "default"),
      block("ppdb", "default"),
      block("kontak", "default"),
    ],
  },
  modern: {
    theme: theme("centered", "flat"),
    layoutBlocks: [
      block("hero", "centered"),
      block("statistik", "row"),
      block("berita", "cards"),
      block("ppdb", "banner"),
      block("prestasi", "default"),
      block("profil", "default"),
      block("galeri", "masonry"),
      block("kontak", "default"),
    ],
  },
  ceria: {
    theme: theme("playful", "card"),
    layoutBlocks: [
      block("hero", "playful"),
      block("keunggulan", "cards"),
      block("galeri", "grid"),
      block("prestasi", "default"),
      block("testimoni", "carousel"),
      block("berita", "cards"),
      block("ppdb", "banner"),
      block("kontak", "default"),
    ],
  },
  aurora: {
    theme: theme("fullbleed", "card"),
    layoutBlocks: [
      block("hero", "fullbleed"),
      block("keunggulan", "grid"),
      block("statistik", "row"),
      block("profil", "default"),
      block("berita", "cards"),
      block("prestasi", "default"),
      block("galeri", "masonry"),
      block("testimoni", "carousel"),
      block("ppdb", "banner"),
      block("kontak", "default"),
    ],
  },
  elegan: {
    theme: theme("split", "card"),
    layoutBlocks: [
      block("hero", "split"),
      block("profil", "default"),
      block("keunggulan", "grid"),
      block("prestasi", "default"),
      block("berita", "cards"),
      block("galeri", "masonry"),
      block("testimoni", "grid"),
      block("kontak", "default"),
    ],
  },
  akademik: {
    theme: theme("split", "bordered"),
    layoutBlocks: [
      block("hero", "split"),
      block("statistik", "row"),
      block("keunggulan", "grid"),
      block("prestasi", "default"),
      block("berita", "list"),
      block("ppdb", "banner"),
      block("profil", "default"),
      block("kontak", "default"),
    ],
  },
  alam: {
    theme: theme("fullbleed", "card"),
    layoutBlocks: [
      block("hero", "fullbleed"),
      block("galeri", "masonry"),
      block("keunggulan", "cards"),
      block("statistik", "tiles"),
      block("prestasi", "default"),
      block("berita", "cards"),
      block("agenda", "default"),
      block("kontak", "default"),
    ],
  },
};

/** Override a site's template, theme tokens and layout with a preset — keeps all
 * resolved content (brand, keunggulan, statistik, testimoni, berita, …). */
export function applyDemoTemplate(site: SiteData, key: TemplateKey): SiteData {
  const preset = TEMPLATE_PRESETS[key];
  return { ...site, templateKey: key, theme: preset.theme, layoutBlocks: preset.layoutBlocks };
}
