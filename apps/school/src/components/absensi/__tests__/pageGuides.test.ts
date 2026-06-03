/**
 * Unit tests for the Absensi page-guide content map. Verifies every expected
 * page id is present, each entry is well-formed, and every role tag resolves
 * to a valid SCHOOL_ROLE_LABEL key.
 */
import { describe, it, expect } from "vitest";
import { ABSENSI_PAGE_GUIDES, type AbsensiGuideId } from "../pageGuides";
import { SCHOOL_ROLE_LABEL } from "../../../lib/schoolGuideRole";

const EXPECTED_IDS: AbsensiGuideId[] = ["dashboard", "daftar", "guru", "pelajaran"];
const VALID_ROLES = new Set(Object.keys(SCHOOL_ROLE_LABEL));

describe("ABSENSI_PAGE_GUIDES", () => {
  it("contains every expected page id", () => {
    for (const id of EXPECTED_IDS) {
      expect(ABSENSI_PAGE_GUIDES[id]).toBeDefined();
    }
    expect(Object.keys(ABSENSI_PAGE_GUIDES).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it("each entry has a non-empty title, intro, at least one step, and tips array", () => {
    for (const id of EXPECTED_IDS) {
      const entry = ABSENSI_PAGE_GUIDES[id];
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.intro.trim().length).toBeGreaterThan(0);
      expect(entry.steps.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(entry.tips)).toBe(true);
    }
  });

  it("each step has a title and only valid role keys", () => {
    for (const id of EXPECTED_IDS) {
      for (const step of ABSENSI_PAGE_GUIDES[id].steps) {
        expect(String(step.title).trim().length).toBeGreaterThan(0);
        for (const role of step.roles ?? []) {
          expect(VALID_ROLES.has(role)).toBe(true);
        }
      }
    }
  });
});
