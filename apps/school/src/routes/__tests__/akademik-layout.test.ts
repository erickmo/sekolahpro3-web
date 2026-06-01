/**
 * Unit tests for the Akademik layout context-bar visibility logic.
 *
 * Covers AKA-07: showContextBar / isPeriodeSelfManaged drive whether the period
 * selector bar is shown. The grid editor (entri-nilai/edit) manages its own
 * period, so the bar must hide there even though the path contains the
 * entri-nilai prefix.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@sekolahpro/api-client", () => ({
  listResource: vi.fn().mockResolvedValue([]),
  useResourceList: vi.fn(() => ({ data: [], isLoading: false })),
}));

import { showContextBar, isPeriodeSelfManaged } from "../sch.$sekolah.akademik";

describe("isPeriodeSelfManaged", () => {
  it("is true only on the grid editor route", () => {
    expect(isPeriodeSelfManaged("/sch/A/akademik/entri-nilai/edit")).toBe(true);
    expect(isPeriodeSelfManaged("/sch/A/akademik/entri-nilai")).toBe(false);
    expect(isPeriodeSelfManaged("/sch/A/akademik/raport")).toBe(false);
  });
});

describe("showContextBar", () => {
  it("shows the bar on operational period-scoped pages", () => {
    expect(showContextBar("/sch/A/akademik/asesmen")).toBe(true);
    expect(showContextBar("/sch/A/akademik/entri-nilai")).toBe(true);
    expect(showContextBar("/sch/A/akademik/raport")).toBe(true);
  });

  it("hides the bar on the self-managed grid editor (despite the entri-nilai prefix)", () => {
    expect(showContextBar("/sch/A/akademik/entri-nilai/edit")).toBe(false);
  });

  it("hides the bar on the dashboard and non-operational pages", () => {
    expect(showContextBar("/sch/A/akademik")).toBe(false);
    expect(showContextBar("/sch/A/master/mapel")).toBe(false);
  });
});
