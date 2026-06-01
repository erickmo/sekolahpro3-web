/**
 * Unit tests for the akademik period localStorage helpers.
 *
 * Covers AKA-17: round-trip persistence plus the defensive paths
 * (missing key, corrupt JSON, and a throwing/unavailable localStorage) that the
 * period-resolution tests do not exercise directly.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { readStoredPeriode, writeStoredPeriode } from "./akademikPeriode";

const SEKOLAH = "SEK1";
const STORAGE_KEY = `akademik:periode:${SEKOLAH}`;

afterEach(() => {
  globalThis.localStorage.clear();
  vi.restoreAllMocks();
});

describe("readStoredPeriode / writeStoredPeriode", () => {
  it("round-trips a stored period", () => {
    writeStoredPeriode(SEKOLAH, { ta: "S-2025", semester: "Genap" });
    expect(readStoredPeriode(SEKOLAH)).toEqual({ ta: "S-2025", semester: "Genap" });
  });

  it("returns an empty object when nothing is stored", () => {
    expect(readStoredPeriode(SEKOLAH)).toEqual({});
  });

  it("returns an empty object when the stored value is corrupt JSON", () => {
    globalThis.localStorage.setItem(STORAGE_KEY, "{not-valid-json");
    expect(readStoredPeriode(SEKOLAH)).toEqual({});
  });

  it("returns an empty object when the stored JSON is not an object", () => {
    globalThis.localStorage.setItem(STORAGE_KEY, "42");
    expect(readStoredPeriode(SEKOLAH)).toEqual({});
  });

  it("swallows write errors (quota / unavailable) without throwing", () => {
    vi.spyOn(globalThis.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => writeStoredPeriode(SEKOLAH, { semester: "Ganjil" })).not.toThrow();
  });
});
