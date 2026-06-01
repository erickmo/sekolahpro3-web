/**
 * Unit tests for the ekskul period context (EKS-16): strict hook throws outside a
 * provider, optional returns null, provider memoises a stable value reference.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  EkskulContextProvider,
  useEkskulContext,
  useEkskulContextOptional,
  type EkskulContextValue,
} from "./ekskulContext";

const value: EkskulContextValue = {
  tahunAjaran: "S-2026",
  semester: "Ganjil",
  setTahunAjaran: vi.fn(),
  setSemester: vi.fn(),
  isPastPeriod: false,
  noActiveTa: false,
  dirty: false,
  setDirty: vi.fn(),
};

function wrapper({ children }: { children: ReactNode }) {
  return <EkskulContextProvider value={value}>{children}</EkskulContextProvider>;
}

afterEach(() => cleanup());

describe("useEkskulContext", () => {
  it("throws when used outside a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useEkskulContext())).toThrow(/EkskulContextProvider/);
    spy.mockRestore();
  });

  it("returns the provided value inside a provider", () => {
    const { result } = renderHook(() => useEkskulContext(), { wrapper });
    expect(result.current.tahunAjaran).toBe("S-2026");
    expect(result.current.semester).toBe("Ganjil");
  });

  it("keeps a stable value reference across re-renders with unchanged inputs", () => {
    const { result, rerender } = renderHook(() => useEkskulContext(), { wrapper });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("useEkskulContextOptional", () => {
  it("returns null outside a provider instead of throwing", () => {
    const { result } = renderHook(() => useEkskulContextOptional());
    expect(result.current).toBeNull();
  });
});
