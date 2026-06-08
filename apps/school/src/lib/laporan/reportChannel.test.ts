import { describe, it, expect } from "vitest";
import { resolveChannel, ENGINE_REPORTS, DINAS_REPORTS } from "./reportChannel";

describe("reportChannel — resolveChannel", () => {
  it("routes the engine's strategic reports to the 'engine' channel", () => {
    expect(resolveChannel("Neraca Koperasi")).toBe("engine");
    expect(resolveChannel("Yayasan Konsolidasi")).toBe("engine");
  });

  it("routes TU compliance reports (in the Dinas map) to the 'dinas' channel", () => {
    expect(resolveChannel("Data Siswa Dapodik")).toBe("dinas");
    expect(resolveChannel("Siswa Missing NISN")).toBe("dinas");
    expect(resolveChannel("Rekap Absensi Siswa")).toBe("dinas");
  });

  it("falls back to 'desk' for a report wired to neither channel", () => {
    expect(resolveChannel("Audit Log Query")).toBe("desk");
    expect(resolveChannel("Some Unknown Report")).toBe("desk");
  });

  it("keeps the channel sets non-overlapping (a report is one channel only)", () => {
    const overlap = ENGINE_REPORTS.filter((r) => DINAS_REPORTS.includes(r));
    expect(overlap).toEqual([]);
  });
});
