/**
 * Unit tests for buildTaSwitch — the in-place Tahun Ajaran switcher wiring shared
 * by the akademik sub-module layouts (absensi/kelas/jadwal/ekskul). Pure: it maps
 * the workspace period context to a StripTahun PeriodSwitch, or undefined when
 * there is nothing to switch between.
 */
import { describe, it, expect, vi } from "vitest";
import { buildTaSwitch } from "./akademikTaSwitch";
import type { PeriodContextValue } from "./periodContext";

function ctx(over: Partial<PeriodContextValue>): PeriodContextValue {
  return {
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
}

describe("buildTaSwitch", () => {
  it("returns undefined when there are no TA options to switch between", () => {
    expect(buildTaSwitch(ctx({}))).toBeUndefined();
    expect(buildTaSwitch(ctx({ taOptions: [] }))).toBeUndefined();
  });

  it("builds a switch from the context's TA options + active TA", () => {
    const options = [
      { value: "S-2025", label: "2025/2026" },
      { value: "S-2024", label: "2024/2025" },
    ];
    const sw = buildTaSwitch(ctx({ taOptions: options }))!;
    expect(sw.value).toBe("S-2025");
    expect(sw.options).toBe(options);
  });

  it("wires onChange to the context's setTahunAjaran", () => {
    const setTahunAjaran = vi.fn();
    const sw = buildTaSwitch(
      ctx({ setTahunAjaran, taOptions: [{ value: "S-2025", label: "2025/2026" }] }),
    )!;
    sw.onChange("S-2024");
    expect(setTahunAjaran).toHaveBeenCalledWith("S-2024");
  });
});
