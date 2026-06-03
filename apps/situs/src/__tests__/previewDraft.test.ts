// Live-preview overlay: the school CMS passes unsaved edits via ?preview=; the
// renderer parses + overlays them onto the resolved site without persisting.
import { describe, expect, it } from "vitest";
import { parsePreviewParam, applyPreviewDraft } from "../lib/site";
import { demoSite } from "../data/demo-site";

describe("parsePreviewParam", () => {
  it("parses a JSON draft from the preview param", () => {
    const search = `?sekolah=x&preview=${encodeURIComponent(JSON.stringify({ template: "modern" }))}`;
    expect(parsePreviewParam(search)).toEqual({ template: "modern" });
  });

  it("returns null when the preview param is absent", () => {
    expect(parsePreviewParam("?sekolah=x")).toBeNull();
  });

  it("returns null when the preview param is not valid JSON", () => {
    expect(parsePreviewParam("?preview=notjson")).toBeNull();
  });
});

describe("applyPreviewDraft", () => {
  it("overlays template, brand color, hero copy, and layout blocks", () => {
    const out = applyPreviewDraft(demoSite, {
      template: "modern",
      brand_color: "#111111",
      hero_judul: "Draf Judul",
      layout_blocks: [
        { tipe: "richtext", variant: "default", aktif: 1, konten: "<p>x</p>" },
        { tipe: "tidak_dikenal", variant: "z", aktif: 1 },
      ],
    });
    expect(out.isPreview).toBe(true);
    expect(out.templateKey).toBe("modern");
    expect(out.brand.color).toBe("#111111");
    expect(out.brand.color2).toBe(demoSite.brand.color2); // untouched
    expect(out.profil.heroJudul).toBe("Draf Judul");
    expect(out.layoutBlocks).toHaveLength(1); // unknown tipe dropped
    expect(out.layoutBlocks[0]).toMatchObject({ tipe: "richtext", aktif: true, konten: "<p>x</p>" });
  });

  it("keeps the existing layout blocks when the draft omits them", () => {
    const out = applyPreviewDraft(demoSite, { template: "ceria" });
    expect(out.layoutBlocks).toBe(demoSite.layoutBlocks);
    expect(out.templateKey).toBe("ceria");
  });
});
