import { describe, it, expect } from "vitest";
import { STAFF_PAGE_GUIDES, type StaffGuideId } from "../pageGuides";
import { SCHOOL_ROLE_LABEL } from "../../../lib/schoolGuideRole";

const EXPECTED_IDS: StaffGuideId[] = [
  "dashboard",
  "berkas",
  "daftar",
  "jabatan",
  "mapel-pengampu",
  "penugasan",
  "sk-jabatan",
  "sk-mengajar",
];

const VALID_ROLES = Object.keys(SCHOOL_ROLE_LABEL);

describe("STAFF_PAGE_GUIDES", () => {
  it("contains every expected page id", () => {
    for (const id of EXPECTED_IDS) {
      expect(STAFF_PAGE_GUIDES[id]).toBeDefined();
    }
  });

  it("has no unexpected page ids", () => {
    expect(Object.keys(STAFF_PAGE_GUIDES).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  for (const id of EXPECTED_IDS) {
    describe(`entry "${id}"`, () => {
      const entry = STAFF_PAGE_GUIDES[id];

      it("has a non-empty title and intro", () => {
        expect(entry.title.trim().length).toBeGreaterThan(0);
        expect(entry.intro.trim().length).toBeGreaterThan(0);
      });

      it("has at least one step", () => {
        expect(entry.steps.length).toBeGreaterThanOrEqual(1);
      });

      it("exposes tips as an array", () => {
        expect(Array.isArray(entry.tips)).toBe(true);
      });

      it("tags every step role with a valid SCHOOL_ROLE key", () => {
        for (const step of entry.steps) {
          for (const role of step.roles ?? []) {
            expect(VALID_ROLES).toContain(role);
          }
        }
      });
    });
  }
});
