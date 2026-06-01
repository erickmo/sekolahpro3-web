import { describe, expect, it } from "vitest";
import { mapSite } from "../lib/site";
import { SECTION_KEYS } from "../constants";

describe("mapSite", () => {
  it("maps snake_case API payload to the SiteData contract", () => {
    const site = mapSite({
      sekolah: "SMA Nusantara",
      nama: "SMA Nusantara",
      template_key: "modern",
      brand: { color: "#123456", color_2: "#abcdef", logo: "/l.png", hero_image: null },
      social: { instagram: "ig", whatsapp: "628" },
      profil: { hero_judul: "Halo", visi: "V", misi: "<p>M</p>", nama_kepsek: "Pak Budi" },
      contact: { telepon: "021", email: "a@b.id" },
      meta: { meta_title: "T", meta_description: "D" },
      sections: ["hero", "berita", "ppdb"],
      nav: [{ to: "/", label: "Beranda", section: "hero" }],
    });
    expect(site.sekolah).toBe("SMA Nusantara");
    expect(site.templateKey).toBe("modern");
    expect(site.brand.color).toBe("#123456");
    expect(site.brand.color2).toBe("#abcdef");
    expect(site.profil.namaKepsek).toBe("Pak Budi");
    expect(site.contact.telepon).toBe("021");
    expect(site.sections).toEqual(["hero", "berita", "ppdb"]);
    expect(site.nav).toHaveLength(1);
  });

  it("falls back to the default template for an unknown key", () => {
    const site = mapSite({ sekolah: "X", template_key: "tidak-ada" });
    expect(site.templateKey).toBe("klasik");
  });

  it("defaults to all sections when none provided", () => {
    const site = mapSite({ sekolah: "X" });
    expect(site.sections).toEqual([...SECTION_KEYS]);
  });

  it("drops unknown section keys", () => {
    const site = mapSite({ sekolah: "X", sections: ["hero", "bogus", "berita"] });
    expect(site.sections).toEqual(["hero", "berita"]);
  });
});
