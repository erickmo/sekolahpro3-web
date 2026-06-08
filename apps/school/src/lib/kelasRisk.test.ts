import { describe, it, expect } from "vitest";
import { collectRiskFlags, type EntriNilaiRow } from "./kelasRisk";

const rows: EntriNilaiRow[] = [
  { siswa: "A", mata_pelajaran: "MTK", predikat: "D" },
  { siswa: "A", mata_pelajaran: "IPA", is_remedial: 1 },
  { siswa: "B", mata_pelajaran: "MTK", predikat: "A" },
  { siswa: "C", mata_pelajaran: "IPS", is_remedial: 1 },
];

describe("kelasRisk — collectRiskFlags", () => {
  it("flags students with predikat D or is_remedial, grouped per student", () => {
    const flags = collectRiskFlags(rows);
    expect(flags.map((f) => f.siswa).sort()).toEqual(["A", "C"]);
  });

  it("aggregates multiple reasons for the same student", () => {
    const flags = collectRiskFlags(rows);
    const a = flags.find((f) => f.siswa === "A");
    expect(a?.reasons.length).toBe(2);
    expect(a?.reasons.join(" ")).toMatch(/MTK/);
    expect(a?.reasons.join(" ")).toMatch(/IPA/);
  });

  it("does not flag students with only good grades", () => {
    const flags = collectRiskFlags(rows);
    expect(flags.some((f) => f.siswa === "B")).toBe(false);
  });

  it("returns an empty list for no rows", () => {
    expect(collectRiskFlags([])).toEqual([]);
  });
});
