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

  it("maps layout blocks, content rows, theme, and hero extra fields", () => {
    const site = mapSite({
      sekolah: "SMA Nusantara",
      profil: {
        hero_eyebrow: "Sejak 1998",
        hero_cta2_label: "Profil Sekolah",
        hero_cta2_url: "/profil",
      },
      layout_blocks: [
        { tipe: "hero", variant: "overlay", aktif: 1, judul: "Halo" },
        { tipe: "richtext", variant: "default", aktif: 0, konten: "<p>x</p>" },
      ],
      keunggulan: [{ ikon: "award", judul: "Akreditasi A", deskripsi: "Unggul" }],
      statistik: [{ label: "Siswa", nilai: "1200", satuan: "anak" }],
      testimoni: [{ nama: "Budi", peran: "Alumni", kutipan: "Mantap" }],
      theme: {
        hero_variant: "overlay",
        radius: "16px",
        font_heading: "Poppins",
        font_body: "Inter",
        shadow: "0 10px 30px rgba(0,0,0,.2)",
        section_style: "flat",
      },
    });
    expect(site.profil.heroEyebrow).toBe("Sejak 1998");
    expect(site.profil.heroCta2Label).toBe("Profil Sekolah");
    expect(site.profil.heroCta2Url).toBe("/profil");
    expect(site.layoutBlocks).toHaveLength(2);
    expect(site.layoutBlocks[0]).toMatchObject({ tipe: "hero", variant: "overlay", aktif: true, judul: "Halo" });
    const secondBlock = site.layoutBlocks[1];
    expect(secondBlock?.aktif).toBe(false);
    expect(secondBlock?.konten).toBe("<p>x</p>");
    expect(site.keunggulan).toEqual([{ ikon: "award", judul: "Akreditasi A", deskripsi: "Unggul" }]);
    expect(site.statistik[0]).toMatchObject({ label: "Siswa", nilai: "1200", satuan: "anak" });
    expect(site.testimoni[0]).toMatchObject({ nama: "Budi", peran: "Alumni", kutipan: "Mantap" });
    expect(site.theme).toEqual({
      heroVariant: "overlay",
      radius: "16px",
      fontHeading: "Poppins",
      fontBody: "Inter",
      shadow: "0 10px 30px rgba(0,0,0,.2)",
      sectionStyle: "flat",
    });
  });

  it("defaults theme + empty arrays when payload omits the block fields", () => {
    const site = mapSite({ sekolah: "X" });
    expect(site.layoutBlocks).toEqual([]);
    expect(site.keunggulan).toEqual([]);
    expect(site.statistik).toEqual([]);
    expect(site.testimoni).toEqual([]);
    expect(site.theme.heroVariant).toBe("split");
    expect(site.theme.sectionStyle).toBe("card");
  });

  it("drops blocks with an unknown tipe", () => {
    const site = mapSite({ sekolah: "X", layout_blocks: [{ tipe: "bogus" }, { tipe: "cta" }] });
    expect(site.layoutBlocks.map((b) => b.tipe)).toEqual(["cta"]);
  });
});
