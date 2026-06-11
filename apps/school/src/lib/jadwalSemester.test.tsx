/**
 * Unit tests for useSemesterDoc — the Semester docname resolver for the Jadwal workspace.
 *
 * Selection chain: explicit pick (still in list) → stored ns value (still in list) → first row.
 * A TA change resets any explicit pick so the new TA's first semester wins.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup, act } from "@testing-library/react";
import { useSemesterDoc, PERIODE_NS } from "./jadwalSemester";
import { writeStoredPeriode } from "./akademikPeriode";

// ── Hoisted mock: useResourceList is swapped per-test via mockReturnValue ──────
const mockUseResourceList = vi.fn();
vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: (...args: unknown[]) => mockUseResourceList(...args),
}));

function makeSemList(names: string[]) {
  return names.map((name) => ({ name, nama: name, tahun_ajaran: "TA-2025" }));
}

function semResult(names: string[]) {
  return { data: makeSemList(names), isLoading: false, isError: false };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  mockUseResourceList.mockReset();
});

describe("useSemesterDoc", () => {
  it("explicit pick that exists in the fetched list wins", () => {
    mockUseResourceList.mockReturnValue(semResult(["SEM-2025-G", "SEM-2025-P"]));
    const { result } = renderHook(() => useSemesterDoc("sekolah-a", "TA-2025"));

    // Default: first row
    expect(result.current.semester).toBe("SEM-2025-G");

    // Explicit pick of second item
    act(() => {
      result.current.setSemester("SEM-2025-P");
    });
    expect(result.current.semester).toBe("SEM-2025-P");
  });

  it("a pick NOT in the list falls through to stored then first", () => {
    mockUseResourceList.mockReturnValue(semResult(["SEM-2025-G", "SEM-2025-P"]));
    const { result } = renderHook(() => useSemesterDoc("sekolah-b", "TA-2025"));

    // Force a pick that isn't in the list (stale/phantom)
    act(() => {
      result.current.setSemester("SEM-9999-STALE");
    });
    // Falls through: no stored value → first row
    expect(result.current.semester).toBe("SEM-2025-G");
  });

  it("stored ns value in list wins over first", () => {
    // Pre-write a stored pick for the jadwal ns
    writeStoredPeriode("sekolah-c", { ta: "TA-2025", semester: "SEM-2025-P" }, PERIODE_NS);
    mockUseResourceList.mockReturnValue(semResult(["SEM-2025-G", "SEM-2025-P"]));
    const { result } = renderHook(() => useSemesterDoc("sekolah-c", "TA-2025"));

    // No explicit pick; stored "SEM-2025-P" is in the list → wins over "SEM-2025-G"
    expect(result.current.semester).toBe("SEM-2025-P");
  });

  it("empty list → semester is empty string", () => {
    mockUseResourceList.mockReturnValue({ data: [], isLoading: false, isError: false });
    const { result } = renderHook(() => useSemesterDoc("sekolah-d", "TA-2025"));
    expect(result.current.semester).toBe("");
  });

  it("TA change re-resolves to the new TA's first semester", () => {
    // TA-2025 list
    mockUseResourceList.mockReturnValue(semResult(["SEM-2025-G", "SEM-2025-P"]));
    const { result, rerender } = renderHook(
      ({ ta }: { ta: string }) => useSemesterDoc("sekolah-e", ta),
      { initialProps: { ta: "TA-2025" } },
    );

    // Pick second semester explicitly
    act(() => {
      result.current.setSemester("SEM-2025-P");
    });
    expect(result.current.semester).toBe("SEM-2025-P");

    // Switch to TA-2026 with a different list
    mockUseResourceList.mockReturnValue(semResult(["SEM-2026-G"]));
    rerender({ ta: "TA-2026" });

    // Explicit pick was reset; resolves to TA-2026's first semester
    expect(result.current.semester).toBe("SEM-2026-G");
  });
});
