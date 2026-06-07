import { describe, it, expect } from "vitest";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { filterJadwalNav, JADWAL_ROLE_LABEL } from "./jadwalNav";

/** Flatten visible item labels for easy assertions. */
function labels(groups: NavTabGroup[]): string[] {
  return groups.flatMap((g) => g.items.map((i) => i.label));
}

describe("filterJadwalNav", () => {
  it("admin (Tata Usaha) melihat seluruh nav termasuk editor slot", () => {
    const l = labels(filterJadwalNav("admin"));
    expect(l).toContain("Jadwal Pelajaran");
    expect(l).toContain("Slot Jadwal");
    expect(l).toContain("Slot Override");
  });

  it("guru hanya melihat Dashboard (halaman penyusun di-route-wall)", () => {
    expect(labels(filterJadwalNav("guru"))).toEqual(["Dashboard"]);
  });

  it("kepala melihat oversight (Jadwal Pelajaran + Override) tanpa editor slot", () => {
    const l = labels(filterJadwalNav("kepala"));
    expect(l).toContain("Jadwal Pelajaran");
    expect(l).toContain("Jadwal Override");
    expect(l).not.toContain("Slot Jadwal");
    expect(l).not.toContain("Slot Override");
  });

  it("membuang grup yang kosong setelah filter (guru hanya sisa Ringkasan)", () => {
    const groups = filterJadwalNav("guru");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("Ringkasan");
  });
});

describe("JADWAL_ROLE_LABEL", () => {
  it("memetakan bucket peran ke label persona Jadwal", () => {
    expect(JADWAL_ROLE_LABEL.admin).toBe("Tata Usaha");
    expect(JADWAL_ROLE_LABEL.guru).toBe("Guru");
    expect(JADWAL_ROLE_LABEL.kepala).toBe("Kepala Sekolah");
  });
});
