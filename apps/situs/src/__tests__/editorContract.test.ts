// Editor → renderer data contract. The school CMS persists layout blocks and child
// arrays in snake_case with Frappe Check fields as 0/1 (see apps/school LayoutBlockRow);
// the backend returns that shape and mapSite() must convert it to the renderer's
// camelCase + boolean SiteData. This pins that conversion so the two apps cannot
// drift silently (the historical aktif: 0|1 vs boolean / cta_label vs ctaLabel risk).

import { describe, expect, it } from "vitest";
import { mapSite } from "../lib/site";

// Mirrors what sekolahpro.api.situs.resolve_site returns for editor-saved data.
const editorPayload = {
  sekolah: "smp-demo",
  nama: "SMP Demo",
  template_key: "modern",
  layout_blocks: [
    { tipe: "hero", variant: "split", aktif: 1, judul: "Halo", subjudul: "Sub", cta_label: "Daftar", cta_url: "/ppdb" },
    { tipe: "richtext", variant: "default", aktif: 0, konten: "<p>isi</p>" },
    { tipe: "tidak_dikenal", variant: "x", aktif: 1 },
  ],
  keunggulan: [{ ikon: "★", judul: "Akreditasi A", deskripsi: "Unggul" }],
  statistik: [{ label: "Siswa", nilai: "1200", satuan: "anak" }],
  testimoni: [{ nama: "Budi", peran: "Alumni", foto: "/budi.png", kutipan: "Sekolah terbaik" }],
};

describe("editor → renderer contract (mapSite)", () => {
  const site = mapSite(editorPayload);

  it("drops blocks whose tipe is not a known block type", () => {
    expect(site.layoutBlocks).toHaveLength(2);
    expect(site.layoutBlocks.map((b) => b.tipe)).toEqual(["hero", "richtext"]);
  });

  it("converts the Frappe Check aktif (0/1) to a boolean", () => {
    expect(site.layoutBlocks[0]!.aktif).toBe(true);
    expect(site.layoutBlocks[1]!.aktif).toBe(false);
  });

  it("renames cta_label/cta_url to ctaLabel/ctaUrl and preserves text fields", () => {
    const hero = site.layoutBlocks[0]!;
    expect(hero.ctaLabel).toBe("Daftar");
    expect(hero.ctaUrl).toBe("/ppdb");
    expect(hero.judul).toBe("Halo");
    expect(hero.subjudul).toBe("Sub");
    expect(site.layoutBlocks[1]!.konten).toBe("<p>isi</p>");
  });

  it("leaves optional block fields undefined when the editor left them blank", () => {
    const richtext = site.layoutBlocks[1]!;
    expect(richtext.ctaLabel).toBeUndefined();
    expect(richtext.ctaUrl).toBeUndefined();
    expect(richtext.judul).toBeUndefined();
  });

  it("maps the child arrays (keunggulan/statistik/testimoni) into the renderer shape", () => {
    expect(site.keunggulan[0]).toEqual({ ikon: "★", judul: "Akreditasi A", deskripsi: "Unggul" });
    expect(site.statistik[0]).toEqual({ label: "Siswa", nilai: "1200", satuan: "anak" });
    expect(site.testimoni[0]).toEqual({ nama: "Budi", peran: "Alumni", foto: "/budi.png", kutipan: "Sekolah terbaik" });
  });

  it("resolves a valid template_key to itself", () => {
    expect(site.templateKey).toBe("modern");
  });
});
