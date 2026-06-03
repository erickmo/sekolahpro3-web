/**
 * Unit tests for the Akademik layout context-bar + period-intro visibility logic.
 *
 * Covers AKA-07: showContextBar / showPeriodeIntro / isPeriodeSelfManaged drive
 * the shell chrome. The period context bar now shows on EVERY Akademik page
 * (mirroring ekstrakurikuler), including the dashboard whose KPIs are
 * period-filtered; only the grid editor (entri-nilai/edit) hides it because it
 * manages its own period. The injected period guide + "Sebaran Tahun Ajaran"
 * overview (showPeriodeIntro) stay scoped to the operational pages.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@sekolahpro/api-client", () => ({
  listResource: vi.fn().mockResolvedValue([]),
  useResourceList: vi.fn(() => ({ data: [], isLoading: false })),
}));

import {
  showContextBar,
  showPeriodeIntro,
  isPeriodeSelfManaged,
} from "../../lib/akademikNav";

describe("isPeriodeSelfManaged", () => {
  it("is true only on the grid editor route", () => {
    expect(isPeriodeSelfManaged("/sch/A/akademik/entri-nilai/edit")).toBe(true);
    expect(isPeriodeSelfManaged("/sch/A/akademik/entri-nilai")).toBe(false);
    expect(isPeriodeSelfManaged("/sch/A/akademik/raport")).toBe(false);
  });
});

describe("showContextBar", () => {
  it("shows the bar on the dashboard and every operational page", () => {
    expect(showContextBar("/sch/A/akademik")).toBe(true);
    expect(showContextBar("/sch/A/akademik/asesmen")).toBe(true);
    expect(showContextBar("/sch/A/akademik/entri-nilai")).toBe(true);
    expect(showContextBar("/sch/A/akademik/raport")).toBe(true);
  });

  it("hides the bar on the self-managed grid editor (despite the entri-nilai prefix)", () => {
    expect(showContextBar("/sch/A/akademik/entri-nilai/edit")).toBe(false);
  });

  it("returns false for non-Akademik paths (defensive guard)", () => {
    expect(showContextBar("/sch/A/master/mapel")).toBe(false);
  });
});

describe("showPeriodeIntro", () => {
  it("injects the period guide + overview only on operational pages", () => {
    expect(showPeriodeIntro("/sch/A/akademik/asesmen")).toBe(true);
    expect(showPeriodeIntro("/sch/A/akademik/entri-nilai")).toBe(true);
    expect(showPeriodeIntro("/sch/A/akademik/raport")).toBe(true);
  });

  it("does not inject it on the dashboard (it has its own guide + viz)", () => {
    expect(showPeriodeIntro("/sch/A/akademik")).toBe(false);
  });

  it("does not inject it on the self-managed grid editor", () => {
    expect(showPeriodeIntro("/sch/A/akademik/entri-nilai/edit")).toBe(false);
  });
});
