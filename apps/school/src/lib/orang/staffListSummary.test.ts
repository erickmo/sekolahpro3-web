import { describe, it, expect } from "vitest";
import {
  countByFlag,
  jabatanSummary,
  penugasanSummary,
  skSummary,
  berkasSummary,
  mapelPengampuSummary,
  daftarSummary,
} from "./staffListSummary";
import type { PegawaiApi } from "../../features/pegawai/roles";

const GURU = { role: "Pegawai Guru" };
const STAFF = { role: "Pegawai Staff" };

describe("countByFlag", () => {
  it("returns zeroed buckets for empty input", () => {
    expect(countByFlag([], "aktif")).toEqual({ Aktif: 0, "Non-aktif": 0 });
  });

  it("splits rows on the 1 flag (active) vs everything else", () => {
    const rows = [{ aktif: 1 }, { aktif: 1 }, { aktif: 0 }];
    expect(countByFlag(rows, "aktif")).toEqual({ Aktif: 2, "Non-aktif": 1 });
  });

  it("treats missing/undefined flags as non-active", () => {
    const rows = [{ aktif: 1 }, {}, { aktif: undefined }];
    expect(countByFlag(rows, "aktif")).toEqual({ Aktif: 1, "Non-aktif": 2 });
  });

  it("buckets sum to the row count", () => {
    const rows = [{ aktif: 1 }, { aktif: 0 }, { aktif: 1 }, {}];
    const c = countByFlag(rows, "aktif");
    const sum = Object.values(c).reduce((a, b) => a + b, 0);
    expect(sum).toBe(rows.length);
  });
});

describe("jabatanSummary", () => {
  it("returns [] for an empty list", () => {
    expect(jabatanSummary([])).toEqual([]);
  });

  it("yields Aktif before Non-aktif with the right tones", () => {
    const items = jabatanSummary([{ aktif: 1 }, { aktif: 0 }, { aktif: 1 }]);
    expect(items.map((i) => i.label)).toEqual(["Aktif", "Non-aktif"]);
    expect(items[0]).toMatchObject({ label: "Aktif", value: 2, tone: "emerald" });
    expect(items[1]).toMatchObject({ label: "Non-aktif", value: 1 });
  });
});

describe("penugasanSummary", () => {
  it("returns [] for an empty list", () => {
    expect(penugasanSummary([])).toEqual([]);
  });

  it("counts by status with Aktif ordered first", () => {
    const items = penugasanSummary([
      { status: "Draft" },
      { status: "Aktif" },
      { status: "Aktif" },
    ]);
    expect(items[0]).toMatchObject({ label: "Aktif", value: 2, tone: "emerald" });
    expect(items.find((i) => i.label === "Draft")?.value).toBe(1);
  });

  it("buckets a missing status under Lainnya", () => {
    const items = penugasanSummary([{}, { status: "Aktif" }]);
    expect(items.find((i) => i.label === "Lainnya")?.value).toBe(1);
  });
});

describe("skSummary", () => {
  it("returns [] for an empty list", () => {
    expect(skSummary([])).toEqual([]);
  });

  it("orders Diterbitkan first and tones it emerald", () => {
    const items = skSummary([
      { status: "Diajukan" },
      { status: "Diterbitkan" },
      { status: "Dicabut" },
    ]);
    expect(items[0]).toMatchObject({ label: "Diterbitkan", tone: "emerald" });
    expect(items.find((i) => i.label === "Dicabut")?.tone).toBe("rose");
  });
});

describe("berkasSummary", () => {
  it("returns [] for an empty list", () => {
    expect(berkasSummary([])).toEqual([]);
  });

  it("counts by status_expire with Aktif emerald and Expired rose", () => {
    const items = berkasSummary([
      { status_expire: "Aktif" },
      { status_expire: "Expired" },
      { status_expire: "Aktif" },
    ]);
    expect(items.find((i) => i.label === "Aktif")).toMatchObject({ value: 2, tone: "emerald" });
    expect(items.find((i) => i.label === "Expired")?.tone).toBe("rose");
  });
});

describe("mapelPengampuSummary", () => {
  it("returns [] for an empty list", () => {
    expect(mapelPengampuSummary([])).toEqual([]);
  });

  it("counts rows per mata pelajaran", () => {
    const items = mapelPengampuSummary([
      { mata_pelajaran: "Matematika" },
      { mata_pelajaran: "Matematika" },
      { mata_pelajaran: "IPA" },
    ]);
    expect(items.find((i) => i.label === "Matematika")?.value).toBe(2);
    expect(items.find((i) => i.label === "IPA")?.value).toBe(1);
  });

  it("buckets a missing mapel under Lainnya", () => {
    const items = mapelPengampuSummary([{}, { mata_pelajaran: "IPA" }]);
    expect(items.find((i) => i.label === "Lainnya")?.value).toBe(1);
  });
});

describe("daftarSummary", () => {
  const list: PegawaiApi[] = [
    { name: "1", is_aktif: 1, roles: [GURU] },
    { name: "2", is_aktif: 1, roles: [GURU] },
    { name: "3", is_aktif: 0, roles: [STAFF] },
    { name: "4", is_aktif: 1, roles: [GURU, STAFF] }, // dual-role
  ];

  it("returns [] for an empty list", () => {
    expect(daftarSummary([])).toEqual([]);
  });

  it("leads with the total headcount", () => {
    const items = daftarSummary(list);
    expect(items[0]).toMatchObject({ label: "Total Pegawai", value: 4 });
  });

  it("counts guru, staff, dual-role without double-counting", () => {
    const items = daftarSummary(list);
    const by = (l: string) => items.find((i) => i.label === l)?.value;
    expect(by("Guru")).toBe(2);
    expect(by("Staff")).toBe(1);
    expect(by("Dual-role")).toBe(1);
  });

  it("counts active pegawai", () => {
    const items = daftarSummary(list);
    expect(items.find((i) => i.label === "Aktif")?.value).toBe(3);
  });
});
