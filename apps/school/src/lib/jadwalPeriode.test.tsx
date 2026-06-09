/**
 * Unit tests for the Jadwal period read-only gate. useJadwalReadOnly returns a
 * gate ONLY for a past/archived TA (auditing); an active or no-active-TA period
 * stays writable (a school can still build the upcoming year).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { JadwalPeriodProvider, useJadwalReadOnly, JADWAL_READ_ONLY_REASON } from "./jadwalPeriode";
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
    return <JadwalPeriodProvider value={value}>{children}</JadwalPeriodProvider>;
  }
  return Wrapper;
}

afterEach(() => cleanup());

describe("useJadwalReadOnly", () => {
  it("gates writes (with a reason) when the period is past/archived", () => {
    const { result } = renderHook(() => useJadwalReadOnly(), { wrapper: makeWrapper({ isPastPeriod: true }) });
    expect(result.current.readOnly).toBe(true);
    expect(result.current.reason).toBe(JADWAL_READ_ONLY_REASON);
  });

  it("stays writable for an active period", () => {
    const { result } = renderHook(() => useJadwalReadOnly(), { wrapper: makeWrapper({ isPastPeriod: false }) });
    expect(result.current.readOnly).toBe(false);
    expect(result.current.reason).toBeUndefined();
  });

  it("stays writable when there is no active TA (can still build next year)", () => {
    const { result } = renderHook(() => useJadwalReadOnly(), {
      wrapper: makeWrapper({ isPastPeriod: false, noActiveTa: true }),
    });
    expect(result.current.readOnly).toBe(false);
  });
});
