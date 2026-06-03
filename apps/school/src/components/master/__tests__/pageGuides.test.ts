import { describe, it, expect } from "vitest";
import { MASTER_PAGE_GUIDES, type MasterGuideId } from "../pageGuides";
import { SCHOOL_ROLE_LABEL } from "../../../lib/schoolGuideRole";

const EXPECTED_IDS: MasterGuideId[] = [
  "dashboard",
  "kkm",
  "komponen-nilai",
  "konfigurasi",
  "kurikulum",
  "mapel",
  "pengguna",
  "tahun-ajaran",
  "unit-jenjang",
];

const VALID_ROLE_KEYS = new Set(Object.keys(SCHOOL_ROLE_LABEL));

describe("MASTER_PAGE_GUIDES", () => {
  it("contains every expected page id", () => {
    for (const id of EXPECTED_IDS) {
      expect(MASTER_PAGE_GUIDES[id]).toBeDefined();
    }
    expect(Object.keys(MASTER_PAGE_GUIDES).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it("each entry has a non-empty title, intro, at least one step, and a tips array", () => {
    for (const id of EXPECTED_IDS) {
      const entry = MASTER_PAGE_GUIDES[id];
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.intro.length).toBeGreaterThan(0);
      expect(entry.steps.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(entry.tips)).toBe(true);
    }
  });

  it("each step has a non-empty title", () => {
    for (const id of EXPECTED_IDS) {
      for (const step of MASTER_PAGE_GUIDES[id].steps) {
        expect(String(step.title).length).toBeGreaterThan(0);
      }
    }
  });

  it("every step role is a valid school role key", () => {
    for (const id of EXPECTED_IDS) {
      for (const step of MASTER_PAGE_GUIDES[id].steps) {
        for (const role of step.roles ?? []) {
          expect(VALID_ROLE_KEYS.has(role)).toBe(true);
        }
      }
    }
  });
});
