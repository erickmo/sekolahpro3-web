/**
 * Unit tests for SimpleDetailPage pure helpers.
 *
 * Covers AKA-27: status → badge tone mapping and field value formatting
 * (custom formatter vs em-dash fallback).
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@sekolahpro/api-client", () => ({
  useResourceDoc: vi.fn(() => ({ data: undefined, isLoading: true })),
}));

import { resolveDetailStatusTone, formatDetailValue } from "./SimpleDetailPage";

describe("resolveDetailStatusTone", () => {
  it("maps known statuses to their tone", () => {
    expect(resolveDetailStatusTone("Aktif")).toBe("success");
    expect(resolveDetailStatusTone("Draft")).toBe("warning");
    expect(resolveDetailStatusTone("Disetujui")).toBe("brand");
  });

  it("falls back to neutral for unknown or missing status", () => {
    expect(resolveDetailStatusTone("Mystery")).toBe("neutral");
    expect(resolveDetailStatusTone(undefined)).toBe("neutral");
  });
});

describe("formatDetailValue", () => {
  it("stringifies non-empty values", () => {
    expect(formatDetailValue("Budi")).toBe("Budi");
    expect(formatDetailValue(75)).toBe("75");
  });

  it("renders an em-dash for null / empty values", () => {
    expect(formatDetailValue(null)).toBe("—");
    expect(formatDetailValue("")).toBe("—");
    expect(formatDetailValue(undefined)).toBe("—");
  });

  it("uses a custom formatter when provided", () => {
    expect(formatDetailValue(0, (v) => `Rp${v}`)).toBe("Rp0");
  });
});
