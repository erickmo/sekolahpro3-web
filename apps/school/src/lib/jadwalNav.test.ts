import { describe, it, expect } from "vitest";
import type { NavTabGroup } from "../components/GroupedNavTabs";
import { filterJadwalNav, JADWAL_ROLE_LABEL } from "./jadwalNav";

/** Flatten visible item labels for easy assertions. */
function labels(groups: NavTabGroup[]): string[] {
  return groups.flatMap((g) => g.items.map((i) => i.label));
}

describe("filterJadwalNav", () => {
  it("admin (Tata Usaha) melihat Susun + builder, bukan Pengawasan/Saya", () => {
    const l = labels(filterJadwalNav("admin"));
    expect(l).toContain("Papan Susun");
    expect(l).toContain("Kotak Permintaan");
    expect(l).toContain("Jadwal Pelajaran");
    expect(l).toContain("Slot Jadwal");
    expect(l).not.toContain("Pantauan");
    expect(l).not.toContain("Agenda Saya");
  });

  it("guru melihat Dashboard + Agenda Saya + Permintaan Saya (penyusun di-route-wall)", () => {
    expect(labels(filterJadwalNav("guru"))).toEqual([
      "Dashboard",
      "Agenda Saya",
      "Permintaan Saya",
    ]);
  });

  it("kepala melihat Pengawasan + oversight, tanpa editor slot / Papan Susun", () => {
    const l = labels(filterJadwalNav("kepala"));
    expect(l).toContain("Pantauan");
    expect(l).toContain("Persetujuan");
    expect(l).toContain("Jadwal Pelajaran");
    expect(l).toContain("Jadwal Override");
    expect(l).not.toContain("Slot Jadwal");
    expect(l).not.toContain("Papan Susun");
  });

  it("membuang grup kosong setelah filter (guru: Ringkasan + Saya)", () => {
    const groups = filterJadwalNav("guru");
    expect(groups.map((g) => g.label)).toEqual(["Ringkasan", "Saya"]);
  });
});

describe("JADWAL_ROLE_LABEL", () => {
  it("memetakan bucket peran ke label persona Jadwal", () => {
    expect(JADWAL_ROLE_LABEL.admin).toBe("Tata Usaha");
    expect(JADWAL_ROLE_LABEL.guru).toBe("Guru");
    expect(JADWAL_ROLE_LABEL.kepala).toBe("Kepala Sekolah");
  });
});
