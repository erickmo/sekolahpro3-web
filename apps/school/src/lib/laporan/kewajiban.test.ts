import { describe, it, expect } from "vitest";
import { computeDueState, KEWAJIBAN_TU, type Kewajiban } from "./kewajiban";

const d = (iso: string) => new Date(`${iso}T00:00:00`);

describe("laporan kewajiban — computeDueState (Bulanan)", () => {
  it("is overdue when today is past the due day of the month", () => {
    const r = computeDueState("Bulanan", 5, d("2026-06-10"));
    expect(r.state).toBe("overdue");
    expect(r.dueDate).toBe("2026-06-05");
  });

  it("is due-soon when the due day is within a week ahead", () => {
    expect(computeDueState("Bulanan", 15, d("2026-06-10")).state).toBe("due-soon");
  });

  it("is upcoming when the due day is more than a week ahead", () => {
    expect(computeDueState("Bulanan", 28, d("2026-06-10")).state).toBe("upcoming");
  });
});

describe("laporan kewajiban — KEWAJIBAN_TU config", () => {
  it("defines obligations whose member reports are all named", () => {
    expect(KEWAJIBAN_TU.length).toBeGreaterThan(0);
    for (const k of KEWAJIBAN_TU as Kewajiban[]) {
      expect(k.id).toBeTruthy();
      expect(k.paket.length).toBeGreaterThan(0);
      for (const ref of k.paket) expect(ref.reportName).toBeTruthy();
    }
  });

  it("includes the Dapodik obligation that drives the NISN data-quality gate", () => {
    const reports = KEWAJIBAN_TU.flatMap((k) => k.paket.map((p) => p.reportName));
    expect(reports).toContain("Siswa Missing NISN");
    expect(reports).toContain("Data Siswa Dapodik");
  });
});
