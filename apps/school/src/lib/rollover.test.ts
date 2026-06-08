import { describe, it, expect } from "vitest";
import { buildRolloverPayload } from "./rollover";

describe("rollover — buildRolloverPayload", () => {
  it("promotes every active student by default (nobody held back)", () => {
    const p = buildRolloverPayload(["A", "B", "C"], new Set());
    expect(p.siswa_naik).toEqual(["A", "B", "C"]);
    expect(p.siswa_tinggal).toEqual([]);
  });

  it("splits held-back students into siswa_tinggal, preserving order", () => {
    const p = buildRolloverPayload(["A", "B", "C", "D"], new Set(["B", "D"]));
    expect(p.siswa_naik).toEqual(["A", "C"]);
    expect(p.siswa_tinggal).toEqual(["B", "D"]);
  });

  it("ignores held-back ids not in the active list", () => {
    const p = buildRolloverPayload(["A"], new Set(["Z"]));
    expect(p.siswa_naik).toEqual(["A"]);
    expect(p.siswa_tinggal).toEqual([]);
  });
});
