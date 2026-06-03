// Template-default Hero (sections/Hero) must honor the CMS hero secondary-CTA
// (Tampilan editor → profil.heroCta2*), not hardcode "Tentang Kami", so the
// editable fields actually take effect on the template-driven homepage.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { Hero } from "../sections/Hero";
import { demoSite } from "../data/demo-site";
import type { SiteData } from "../types";
import { renderWithSite } from "./test-utils";

afterEach(cleanup);

function siteWith(profil: Partial<SiteData["profil"]>): SiteData {
  return { ...demoSite, profil: { ...demoSite.profil, ...profil } };
}

describe("template Hero secondary CTA", () => {
  it("uses the CMS hero secondary CTA when set", () => {
    renderWithSite(<Hero variant="klasik" />, siteWith({ heroCta2Label: "Hubungi Kami", heroCta2Url: "/kontak" }));
    const link = screen.getByRole("link", { name: "Hubungi Kami" });
    expect(link).toHaveAttribute("href", "/kontak");
  });

  it("falls back to 'Tentang Kami' → /profil when no secondary CTA is configured", () => {
    renderWithSite(<Hero variant="klasik" />, siteWith({ heroCta2Label: undefined, heroCta2Url: undefined }));
    const link = screen.getByRole("link", { name: "Tentang Kami" });
    expect(link).toHaveAttribute("href", "/profil");
  });
});
