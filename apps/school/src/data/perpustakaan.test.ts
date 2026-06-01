// PERP-GAP-16
import { describe, it, expect } from "vitest";
import { BUKU_LIST, findBuku, listBukuForSekolah } from "./perpustakaan";

const sample = BUKU_LIST[0]!;

describe("findBuku", () => {
  it("resolves a book by its isbn", () => {
    expect(findBuku(sample.isbn)).toEqual(sample);
  });

  it("respects the sekolah scope", () => {
    expect(findBuku(sample.isbn, sample.sekolah)).toEqual(sample);
    expect(findBuku(sample.isbn, "sekolah-lain")).toBeUndefined();
  });

  it("returns undefined for an unknown isbn", () => {
    expect(findBuku("isbn-tidak-ada")).toBeUndefined();
  });
});

describe("listBukuForSekolah", () => {
  it("returns only books scoped to the given school", () => {
    const rows = listBukuForSekolah(sample.sekolah);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((b) => b.sekolah === sample.sekolah)).toBe(true);
  });

  it("returns an empty array for an unknown school", () => {
    expect(listBukuForSekolah("sekolah-tidak-ada")).toEqual([]);
  });
});
