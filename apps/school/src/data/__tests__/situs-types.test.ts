// Compile-time + runtime contract: SitusDoc carries the Phase-3 fields the CMS edits.
import { describe, it, expect } from "vitest";
import type {
  SitusDoc,
  LayoutBlockRow,
  KeunggulanRow,
  StatistikRow,
  TestimoniRow,
} from "../situs";

describe("SitusDoc Phase-3 shape", () => {
  it("accepts hero secondary fields + child arrays", () => {
    const block: LayoutBlockRow = { tipe: "hero", variant: "split", aktif: 1 };
    const keunggulan: KeunggulanRow = { ikon: "shield", judul: "Aman", deskripsi: "CCTV 24 jam" };
    const statistik: StatistikRow = { label: "Siswa", nilai: "1200", satuan: "anak" };
    const testimoni: TestimoniRow = { nama: "Budi", peran: "Wali", foto: "", kutipan: "Bagus" };
    const doc: Partial<SitusDoc> = {
      hero_eyebrow: "Selamat datang",
      hero_cta2_label: "Hubungi Kami",
      hero_cta2_url: "/kontak",
      layout_blocks: [block],
      keunggulan: [keunggulan],
      statistik: [statistik],
      testimoni: [testimoni],
    };
    expect(doc.layout_blocks).toHaveLength(1);
    expect(doc.keunggulan?.[0]?.judul).toBe("Aman");
    expect(doc.statistik?.[0]?.nilai).toBe("1200");
    expect(doc.testimoni?.[0]?.kutipan).toBe("Bagus");
  });
});
