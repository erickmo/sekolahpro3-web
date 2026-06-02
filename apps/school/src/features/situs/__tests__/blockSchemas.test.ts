import { describe, it, expect } from "vitest";
import {
  KEUNGGULAN_SCHEMA,
  STATISTIK_SCHEMA,
  TESTIMONI_SCHEMA,
  LAYOUT_BLOCK_FIELDS,
  BLOCK_TIPE_OPTIONS,
  BLOCK_VARIANTS,
} from "../blockSchemas";

describe("Phase-3 child + block schemas", () => {
  it("keunggulan/statistik/testimoni expose the contract fields", () => {
    expect(KEUNGGULAN_SCHEMA.field).toBe("keunggulan");
    expect(KEUNGGULAN_SCHEMA.fields.map((f) => f.name)).toEqual(["ikon", "judul", "deskripsi"]);
    expect(STATISTIK_SCHEMA.fields.map((f) => f.name)).toEqual(["label", "nilai", "satuan"]);
    expect(TESTIMONI_SCHEMA.fields.map((f) => f.name)).toEqual(["nama", "peran", "foto", "kutipan"]);
  });

  it("layout block fields cover judul/subjudul/cta/konten", () => {
    const names = LAYOUT_BLOCK_FIELDS.map((f) => f.name);
    expect(names).toEqual(["judul", "subjudul", "cta_label", "cta_url", "konten"]);
  });

  it("tipe options match the backend Select and each has a variant list", () => {
    expect(BLOCK_TIPE_OPTIONS).toContain("hero");
    expect(BLOCK_TIPE_OPTIONS).toContain("richtext");
    expect(BLOCK_TIPE_OPTIONS).toHaveLength(13);
    for (const t of BLOCK_TIPE_OPTIONS) {
      expect(BLOCK_VARIANTS[t].length).toBeGreaterThan(0);
    }
  });

  it("hero + section variants match the SPA registry contract", () => {
    expect(BLOCK_VARIANTS.hero).toEqual(["split", "centered", "fullbleed", "overlay", "playful"]);
    expect(BLOCK_VARIANTS.keunggulan).toEqual(["default", "grid", "cards"]);
    expect(BLOCK_VARIANTS.statistik).toEqual(["default", "row", "bar", "tiles"]);
    expect(BLOCK_VARIANTS.testimoni).toEqual(["default", "carousel", "grid"]);
    expect(BLOCK_VARIANTS.berita).toEqual(["default", "cards", "list"]);
    expect(BLOCK_VARIANTS.galeri).toEqual(["default", "grid", "masonry"]);
    expect(BLOCK_VARIANTS.ppdb).toEqual(["default", "banner"]);
    expect(BLOCK_VARIANTS.cta).toEqual(["default", "banner", "split"]);
    for (const t of ["profil", "agenda", "prestasi", "kontak", "richtext"] as const) {
      expect(BLOCK_VARIANTS[t]).toEqual(["default"]);
    }
  });
});
