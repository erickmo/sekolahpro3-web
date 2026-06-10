/**
 * Unit tests for the Kelas period read-only gate. useKelasReadOnly gates writes
 * ONLY for a past/archived TA (auditing); an active period or a school with no
 * active TA stays writable (a new school must still create its first rombel).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { KelasPeriodProvider, useKelasReadOnly, KELAS_READ_ONLY_REASON } from "./kelasPeriode";
import type { PeriodContextValue } from "./periodContext";

function makeWrapper(over: Partial<PeriodContextValue>) {
  const value: PeriodContextValue = {
    tahunAjaran: "S-2025",
    semester: "Ganjil",
    setTahunAjaran: vi.fn(),
    setSemester: vi.fn(),
    isPastPeriod: false,
    noActiveTa: false,
    dirty: false,
    setDirty: vi.fn(),
    ...over,
  };
  function Wrapper({ children }: { children: ReactNode }) {
    return <KelasPeriodProvider value={value}>{children}</KelasPeriodProvider>;
  }
  return Wrapper;
}

afterEach(() => cleanup());

describe("useKelasReadOnly", () => {
  it("gates writes (with a reason) when the period is past/archived", () => {
    const { result } = renderHook(() => useKelasReadOnly(), { wrapper: makeWrapper({ isPastPeriod: true }) });
    expect(result.current.readOnly).toBe(true);
    expect(result.current.reason).toBe(KELAS_READ_ONLY_REASON);
  });

  it("stays writable for an active period", () => {
    const { result } = renderHook(() => useKelasReadOnly(), { wrapper: makeWrapper({ isPastPeriod: false }) });
    expect(result.current.readOnly).toBe(false);
    expect(result.current.reason).toBeUndefined();
  });

  it("stays writable when there is no active TA (new school can still build rombel)", () => {
    const { result } = renderHook(() => useKelasReadOnly(), {
      wrapper: makeWrapper({ isPastPeriod: false, noActiveTa: true }),
    });
    expect(result.current.readOnly).toBe(false);
  });
});
