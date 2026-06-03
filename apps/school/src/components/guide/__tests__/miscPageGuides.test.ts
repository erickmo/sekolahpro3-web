import { describe, it, expect } from "vitest";
import { MISC_PAGE_GUIDES, type MiscGuideId } from "../miscPageGuides";
import { SCHOOL_ROLE_LABEL } from "../../../lib/schoolGuideRole";

const EXPECTED_IDS: MiscGuideId[] = ["dashboard", "audit", "laporan", "pesan", "pickup-verify"];

const VALID_ROLES = new Set(Object.keys(SCHOOL_ROLE_LABEL));

describe("MISC_PAGE_GUIDES content", () => {
  it("has an entry for every expected page id", () => {
    for (const id of EXPECTED_IDS) {
      expect(MISC_PAGE_GUIDES[id], `missing guide for ${id}`).toBeTruthy();
    }
  });

  it("each entry has complete, non-empty content", () => {
    for (const id of EXPECTED_IDS) {
      const guide = MISC_PAGE_GUIDES[id];
      expect(guide.title.length, `empty title for ${id}`).toBeGreaterThan(0);
      expect(guide.intro.length, `empty intro for ${id}`).toBeGreaterThan(0);
      expect(guide.steps.length, `no steps for ${id}`).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(guide.tips), `tips not array for ${id}`).toBe(true);
    }
  });

  it("only references known school roles in step tags", () => {
    for (const id of EXPECTED_IDS) {
      for (const step of MISC_PAGE_GUIDES[id].steps) {
        for (const role of step.roles ?? []) {
          expect(VALID_ROLES.has(role), `unknown role "${role}" in ${id}`).toBe(true);
        }
      }
    }
  });
});
