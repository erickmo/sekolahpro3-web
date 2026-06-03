import { describe, it, expect } from "vitest";
import { KELAS_PAGE_GUIDES, type KelasGuideId } from "../pageGuides";
import { SCHOOL_ROLE_LABEL } from "../../../lib/schoolGuideRole";

const EXPECTED_IDS: KelasGuideId[] = ["dashboard", "anggota", "daftar", "rombel"];
const VALID_ROLES = new Set(Object.keys(SCHOOL_ROLE_LABEL));

describe("KELAS_PAGE_GUIDES", () => {
  it("contains every expected page id", () => {
    for (const id of EXPECTED_IDS) {
      expect(KELAS_PAGE_GUIDES[id]).toBeDefined();
    }
    expect(Object.keys(KELAS_PAGE_GUIDES).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it("has well-formed content for each entry", () => {
    for (const id of EXPECTED_IDS) {
      const entry = KELAS_PAGE_GUIDES[id];
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.intro.length).toBeGreaterThan(0);
      expect(entry.steps.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(entry.tips)).toBe(true);
    }
  });

  it("tags every step role with a valid SCHOOL_ROLE key", () => {
    for (const id of EXPECTED_IDS) {
      for (const step of KELAS_PAGE_GUIDES[id].steps) {
        for (const role of step.roles ?? []) {
          expect(VALID_ROLES.has(role)).toBe(true);
        }
      }
    }
  });
});
