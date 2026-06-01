/**
 * Unit tests for the akademik period context.
 *
 * Covers AKA-16: the strict hook throws outside a provider, the optional hook
 * returns null, and the provider exposes a stable (memoised) value to consumers.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  AkademikContextProvider,
  useAkademikContext,
  useAkademikContextOptional,
  type AkademikContextValue,
} from "./akademikContext";

const value: AkademikContextValue = {
  tahunAjaran: "S-2025",
  semester: "Genap",
  setTahunAjaran: vi.fn(),
  setSemester: vi.fn(),
  isPastPeriod: false,
  noActiveTa: false,
  dirty: false,
  setDirty: vi.fn(),
};

function wrapper({ children }: { children: ReactNode }) {
  return <AkademikContextProvider value={value}>{children}</AkademikContextProvider>;
}

afterEach(() => cleanup());

describe("useAkademikContext", () => {
  it("throws when used outside a provider", () => {
    // React logs the thrown render error; silence it to keep test output clean.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAkademikContext())).toThrow(/AkademikContextProvider/);
    spy.mockRestore();
  });

  it("returns the provided value inside a provider", () => {
    const { result } = renderHook(() => useAkademikContext(), { wrapper });
    expect(result.current.tahunAjaran).toBe("S-2025");
    expect(result.current.semester).toBe("Genap");
  });

  it("keeps a stable value reference across re-renders with unchanged inputs", () => {
    const { result, rerender } = renderHook(() => useAkademikContext(), { wrapper });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("useAkademikContextOptional", () => {
  it("returns null outside a provider instead of throwing", () => {
    const { result } = renderHook(() => useAkademikContextOptional());
    expect(result.current).toBeNull();
  });

  it("returns the value inside a provider", () => {
    const { result } = renderHook(() => useAkademikContextOptional(), { wrapper });
    expect(result.current?.tahunAjaran).toBe("S-2025");
  });
});
