// vitest.config sets globals:false → import test API explicitly.
import { describe, expect, it } from "vitest";
import { findKoperasiBySlug } from "../resolveKoperasi";
import type { KoperasiCard } from "../../../data/sekolah";

const kopA: KoperasiCard = {
  koperasi: "KOP-O1-0001",
  nama: "Koperasi YPKI",
  slug: "ypki",
  role_koperasi: "Teller",
  logo: null,
  status: "Aktif",
  organisasi: "O1",
  organisasi_nama: "Org 1",
};

const kopB: KoperasiCard = {
  ...kopA,
  koperasi: "KOP-O2-0001",
  nama: "Koperasi Nuris",
  slug: "nuris",
  organisasi: "O2",
  organisasi_nama: "Org 2",
};

describe("findKoperasiBySlug", () => {
  it("returns the koperasi whose slug matches", () => {
    expect(findKoperasiBySlug([kopA, kopB], "nuris")).toBe(kopB);
  });

  it("returns undefined when no koperasi matches the slug", () => {
    expect(findKoperasiBySlug([kopA, kopB], "tidak-ada")).toBeUndefined();
  });

  it("returns undefined for an empty list", () => {
    expect(findKoperasiBySlug([], "ypki")).toBeUndefined();
  });

  it("returns undefined when the list is missing", () => {
    expect(findKoperasiBySlug(undefined, "ypki")).toBeUndefined();
  });
});
