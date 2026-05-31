import { describe, it, expect } from "vitest";
import { findActiveItem } from "../MegaMenuNav";
import type { NavTabGroup } from "../GroupedNavTabs";

const GROUPS: NavTabGroup[] = [
  {
    label: "Umum",
    items: [
      { to: "/sch/x/master", label: "Dashboard", exact: true },
      { to: "/sch/x/master/pengguna", label: "Pengguna" },
    ],
  },
  {
    label: "Akademik",
    items: [
      { to: "/sch/x/master/tahun-ajaran", label: "Tahun Ajaran" },
      { to: "/sch/x/master/kurikulum", label: "Kurikulum" },
    ],
  },
];

// findActiveItem drives the trigger label + highlight; verify specificity rules.
describe("MegaMenuNav findActiveItem", () => {
  it("returns exact match for dashboard root", () => {
    expect(findActiveItem(GROUPS, "/sch/x/master")?.label).toBe("Dashboard");
  });

  it("matches nested detail route to its leaf item", () => {
    expect(
      findActiveItem(GROUPS, "/sch/x/master/tahun-ajaran/SMP-2026")?.label,
    ).toBe("Tahun Ajaran");
  });

  it("prefers the longest (most specific) matching item", () => {
    // Dashboard is exact, so on a nested path only the deeper item should win.
    expect(findActiveItem(GROUPS, "/sch/x/master/kurikulum")?.label).toBe(
      "Kurikulum",
    );
  });

  it("returns undefined when no item matches", () => {
    expect(findActiveItem(GROUPS, "/sch/x/siswa")).toBeUndefined();
  });
});
