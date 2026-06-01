import { describe, it, expect } from "vitest";
import { ORANG_GLOSSARY, glossaryFor } from "./glossary";

const REQUIRED_TERMS = [
  "NISN",
  "NIS",
  "NIK",
  "Dapodik",
  "Rombel",
  "Mutasi",
  "Mutasi Masuk",
  "Kelulusan",
  "Ijazah",
  "Persetujuan Wali",
  "JJM",
  "SK Mengajar",
  "SK Jabatan",
  "Sertifikasi",
  "GTY",
  "PPPK",
  "PNS",
  "Honorer",
];

describe("ORANG_GLOSSARY", () => {
  it("contains every required term", () => {
    for (const term of REQUIRED_TERMS) {
      expect(ORANG_GLOSSARY[term], `missing term: ${term}`).toBeDefined();
    }
  });

  it("has a non-empty explanation for every key", () => {
    for (const [key, value] of Object.entries(ORANG_GLOSSARY)) {
      expect(value.trim().length, `empty explanation for: ${key}`).toBeGreaterThan(0);
    }
  });
});

describe("glossaryFor", () => {
  it("returns the explanation text for a known term", () => {
    expect(glossaryFor("NISN")).toBe(ORANG_GLOSSARY.NISN);
  });

  it("returns undefined for an unknown term", () => {
    expect(glossaryFor("TidakAda")).toBeUndefined();
  });
});
