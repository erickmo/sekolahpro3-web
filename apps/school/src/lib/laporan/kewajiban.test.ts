import { describe, it, expect } from "vitest";
import {
  computeDueState,
  sortKewajibanByUrgency,
  KEWAJIBAN_TU,
  type Kewajiban,
} from "./kewajiban";

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

describe("laporan kewajiban — sortKewajibanByUrgency", () => {
  const k = (id: string, dueDay: number): Kewajiban => ({
    id,
    nama: id,
    target: "Dinas",
    periode: "Bulanan",
    dueDay,
    paket: [{ reportName: "X", defaultFmt: "xlsx" }],
  });

  it("orders overdue first, then due-soon, then upcoming", () => {
    const ref = new Date("2026-06-10T00:00:00");
    // dueDay 5 → overdue, dueDay 12 → due-soon, dueDay 28 → upcoming
    const sorted = sortKewajibanByUrgency([k("late", 5), k("soon", 12), k("far", 28)], ref);
    expect(sorted.map((s) => s.kewajiban.id)).toEqual(["late", "soon", "far"]);
    expect(sorted[0]!.state).toBe("overdue");
  });
});
