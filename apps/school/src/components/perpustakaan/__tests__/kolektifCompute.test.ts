// PERP-GAP-25 | PERP-GAP-26
import { describe, it, expect } from "vitest";
import {
  parseScanCodes,
  isDuplicateItem,
  resolveItem,
  bulkAdd,
  type ItemRow,
} from "../kolektifCompute";

describe("parseScanCodes", () => {
  it("splits on newlines and commas, trimming and dropping blanks", () => {
    expect(parseScanCodes("INV-001\nINV-002, INV-003\n\n  ")).toEqual([
      "INV-001",
      "INV-002",
      "INV-003",
    ]);
  });

  it("returns an empty list for empty/whitespace input", () => {
    expect(parseScanCodes("   \n , ")).toEqual([]);
  });
});

describe("isDuplicateItem", () => {
  const items: ItemRow[] = [{ eksemplar: "EK-1", nomor_inventaris: "INV-001" }];

  it("matches on eksemplar id", () => {
    expect(isDuplicateItem(items, "EK-1")).toBe(true);
  });

  it("matches on nomor_inventaris", () => {
    expect(isDuplicateItem(items, "INV-001")).toBe(true);
  });

  it("is false for an unknown code", () => {
    expect(isDuplicateItem(items, "EK-9")).toBe(false);
  });

  it("is false against an empty list", () => {
    expect(isDuplicateItem([], "EK-1")).toBe(false);
  });
});

describe("resolveItem", () => {
  it("maps an available row to an ItemRow", () => {
    expect(
      resolveItem("INV-001", {
        name: "EK-1",
        nomor_inventaris: "INV-001",
        buku: "Fisika Dasar",
        status: "Tersedia",
      }),
    ).toEqual({ eksemplar: "EK-1", nomor_inventaris: "INV-001", judul_buku: "Fisika Dasar" });
  });

  it("defaults missing inventory/title to empty strings", () => {
    expect(resolveItem("EK-2", { name: "EK-2" })).toEqual({
      eksemplar: "EK-2",
      nomor_inventaris: "",
      judul_buku: "",
    });
  });

  it("reports a blank scan code", () => {
    expect(resolveItem("   ", { name: "EK-3" })).toEqual({ error: "kosong" });
  });

  it("reports not-found when no row matched", () => {
    expect(resolveItem("EK-X", undefined)).toEqual({ error: "EK-X: tidak ditemukan" });
  });

  it("blocks a copy whose status is not Tersedia", () => {
    expect(resolveItem("EK-4", { name: "EK-4", status: "Dipinjam" })).toEqual({
      error: "EK-4: status Dipinjam",
    });
  });
});

describe("bulkAdd", () => {
  it("appends a new item", () => {
    expect(bulkAdd([{ eksemplar: "EK-1" }], { eksemplar: "EK-2" })).toEqual([
      { eksemplar: "EK-1" },
      { eksemplar: "EK-2" },
    ]);
  });

  it("skips an item whose eksemplar id already exists (dedup)", () => {
    const list: ItemRow[] = [{ eksemplar: "EK-1", nomor_inventaris: "INV-001" }];
    expect(bulkAdd(list, { eksemplar: "EK-1", nomor_inventaris: "INV-999" })).toEqual(list);
  });

  it("does not mutate the input list", () => {
    const list: ItemRow[] = [{ eksemplar: "EK-1" }];
    const out = bulkAdd(list, { eksemplar: "EK-2" });
    expect(list).toEqual([{ eksemplar: "EK-1" }]);
    expect(out).not.toBe(list);
  });

  it("adds onto an empty list", () => {
    expect(bulkAdd([], { eksemplar: "EK-1" })).toEqual([{ eksemplar: "EK-1" }]);
  });
});
