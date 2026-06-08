import { describe, it, expect } from "vitest";
import { evaluateNisnGate, extractRows } from "./nisnGate";

describe("laporan nisnGate — extractRows", () => {
  it("pulls the data array from the export_data JSON envelope (string)", () => {
    expect(extractRows('{"report":"Siswa Missing NISN","data":[{"nis":"1"},{"nis":"2"}]}')).toHaveLength(2);
  });

  it("pulls the data array from an already-parsed envelope (object)", () => {
    expect(extractRows({ data: [{ nis: "1" }] })).toHaveLength(1);
  });

  it("accepts a bare array fallback", () => {
    expect(extractRows([1, 2, 3])).toHaveLength(3);
  });

  it("returns [] for unparseable / empty input", () => {
    expect(extractRows("not json")).toEqual([]);
    expect(extractRows(null)).toEqual([]);
  });
});

describe("laporan nisnGate — evaluateNisnGate", () => {
  it("clears the gate when there are zero NISN problems", () => {
    expect(evaluateNisnGate([])).toEqual({ blocked: false, count: 0 });
  });

  it("blocks submission when any student is missing a NISN", () => {
    expect(evaluateNisnGate([{}, {}])).toEqual({ blocked: true, count: 2 });
  });
});
