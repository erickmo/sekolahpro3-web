// HeroBlock render contract: every HERO_VARIANT (split/centered/fullbleed/
// overlay/playful) MUST render an <h1> with the title, a primary CTA link, and
// the profil secondary CTA. Block-level judul/subjudul/cta override the profil
// defaults. The eyebrow label renders above the title.

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { HERO_VARIANTS } from "../constants";
import { HeroBlock } from "../templates/blocks/HeroBlock";
import { demoSite } from "../data/demo-site";
import type { LayoutBlock, SiteData } from "../types";
import { renderWithSite } from "./test-utils";

afterEach(cleanup);

const site: SiteData = {
  ...demoSite,
  profil: {
    ...demoSite.profil,
    heroEyebrow: "Sejak 1998",
    heroCta2Label: "Profil Sekolah",
    heroCta2Url: "/profil",
  },
};

function block(variant: string): LayoutBlock {
  return { tipe: "hero", variant, aktif: true };
}

describe("HeroBlock", () => {
  for (const v of HERO_VARIANTS) {
    it(`renders title, primary + secondary CTA for the "${v}" variant`, () => {
      renderWithSite(<HeroBlock block={block(v)} />, site);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.profil.heroJudul);
      expect(screen.getByRole("link", { name: site.profil.heroCtaLabel })).toHaveAttribute("href", "/ppdb");
      expect(screen.getByRole("link", { name: "Profil Sekolah" })).toHaveAttribute("href", "/profil");
    });
  }

  it("uses the block judul/subjudul/cta overrides when present", () => {
    renderWithSite(
      <HeroBlock block={{ tipe: "hero", variant: "split", aktif: true, judul: "Override", ctaLabel: "Daftar", ctaUrl: "/x" }} />,
      site,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Override");
    expect(screen.getByRole("link", { name: "Daftar" })).toHaveAttribute("href", "/x");
  });

  it("shows the eyebrow label", () => {
    renderWithSite(<HeroBlock block={block("overlay")} />, site);
    expect(screen.getByText("Sejak 1998")).toBeInTheDocument();
  });
});
