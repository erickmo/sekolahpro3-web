/**
 * Unit tests for the shared period-context factory.
 *
 * The factory backs both the akademik and ekstrakurikuler period contexts
 * (Tahun Ajaran + Semester). The load-bearing invariant the per-module clones
 * used to guarantee is IDENTITY ISOLATION: a value provided through one
 * factory instance must NOT be visible through another instance's hook, so a
 * hook rendered under the wrong provider throws instead of silently reading the
 * other module's period. These tests pin that invariant plus the throw message,
 * the null-outside-provider contract, and memo stability.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { createPeriodContext, type PeriodContextValue } from "./periodContext";

const value: PeriodContextValue = {
  tahunAjaran: "S-2025",
  semester: "Genap",
  setTahunAjaran: vi.fn(),
  setSemester: vi.fn(),
  isPastPeriod: false,
  noActiveTa: false,
  dirty: false,
  setDirty: vi.fn(),
};

afterEach(() => cleanup());

describe("createPeriodContext", () => {
  it("derives the throw message from the given name", () => {
    const { useValue } = createPeriodContext("Akademik");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useValue())).toThrow(/AkademikContextProvider/);
    spy.mockRestore();
  });

  it("returns null from the optional hook outside a provider", () => {
    const { useValueOptional } = createPeriodContext("Ekskul");
    const { result } = renderHook(() => useValueOptional());
    expect(result.current).toBeNull();
  });

  it("exposes the provided value inside its own provider", () => {
    const { Provider, useValue } = createPeriodContext("Akademik");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider value={value}>{children}</Provider>
    );
    const { result } = renderHook(() => useValue(), { wrapper });
    expect(result.current.tahunAjaran).toBe("S-2025");
    expect(result.current.semester).toBe("Genap");
  });

  it("memoises a stable value reference across re-renders with unchanged inputs", () => {
    const { Provider, useValue } = createPeriodContext("Akademik");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider value={value}>{children}</Provider>
    );
    const { result, rerender } = renderHook(() => useValue(), { wrapper });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("keeps two instances isolated — one provider is invisible to the other's hook", () => {
    const akademik = createPeriodContext("Akademik");
    const ekskul = createPeriodContext("Ekskul");
    // Render ekskul's OPTIONAL hook under akademik's provider: because the two
    // instances mint distinct React contexts, ekskul sees no provider → null.
    const wrapper = ({ children }: { children: ReactNode }) => (
      <akademik.Provider value={value}>{children}</akademik.Provider>
    );
    const { result } = renderHook(() => ekskul.useValueOptional(), { wrapper });
    expect(result.current).toBeNull();
  });
});
