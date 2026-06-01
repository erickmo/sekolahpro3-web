// PERP-GAP-11 | PERP-GAP-23
import { describe, it, expect } from "vitest";
import { computePengadaanTotals, buildPreviewInventaris } from "../pengadaanCompute";

describe("computePengadaanTotals", () => {
  it("sums copies and cost, treating non-numeric as 0", () => {
    expect(
      computePengadaanTotals([
        { jumlah_eksemplar: 3, harga_satuan: 10000 },
        { jumlah_eksemplar: "2", harga_satuan: "5000" },
        { jumlah_eksemplar: "abc", harga_satuan: 9999 },
      ]),
    ).toEqual({ totalEksemplar: 5, totalBiaya: 40000 });
  });

  it("returns zeros for no items", () => {
    expect(computePengadaanTotals([])).toEqual({ totalEksemplar: 0, totalBiaya: 0 });
  });
});

describe("buildPreviewInventaris", () => {
  it("generates an inventory range per valid line, using the explicit prefix", () => {
    expect(
      buildPreviewInventaris([{ buku: "BUKU-1", buku_label: "Fisika", jumlah_eksemplar: 3, prefix_inventaris: "INV-2026" }]),
    ).toEqual(["Fisika → INV-2026-001 … INV-2026-003 (3 eksemplar)"]);
  });

  it("falls back to the first 8 chars of the book id for the inventory prefix", () => {
    // Label shows the full book id; only the generated inventory numbers use the 8-char prefix.
    expect(buildPreviewInventaris([{ buku: "BUKU-123456789", jumlah_eksemplar: 2 }])).toEqual([
      "BUKU-123456789 → BUKU-123-001 … BUKU-123-002 (2 eksemplar)",
    ]);
  });

  it("skips lines without a book or with zero quantity", () => {
    expect(buildPreviewInventaris([{ jumlah_eksemplar: 5 }, { buku: "B", jumlah_eksemplar: 0 }])).toEqual([]);
  });
});
