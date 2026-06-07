import { describe, it, expect } from "vitest";
import { computeDeadlines, type Deadline } from "./keuanganCalendar";

const byId = (ds: Deadline[], id: string) => ds.find((d) => d.id === id);

describe("computeDeadlines — statutory Indonesian tax + month-end close", () => {
  it("includes the PPN masa deadline on the 15th", () => {
    const ds = computeDeadlines("2026-06-10");
    const ppn = byId(ds, "ppn-masa");
    expect(ppn?.dueDate).toBe("2026-06-15");
    expect(ppn?.daysLeft).toBe(5);
    expect(ppn?.severity).toBe("amber"); // <= 7 days
    expect(ppn?.to.length).toBeGreaterThan(0);
  });

  it("includes the PPh-21 reporting deadline on the 20th", () => {
    const pph = byId(computeDeadlines("2026-06-10"), "pph-21");
    expect(pph?.dueDate).toBe("2026-06-20");
    expect(pph?.daysLeft).toBe(10);
    expect(pph?.severity).toBe("emerald"); // > 7 days
  });

  it("includes the month-end Tutup Buku deadline on the last day", () => {
    const close = byId(computeDeadlines("2026-06-10"), "tutup-buku");
    expect(close?.dueDate).toBe("2026-06-30");
    expect(close?.daysLeft).toBe(20);
  });

  it("rolls statutory dates to next month once the day has passed", () => {
    const ppn = byId(computeDeadlines("2026-06-16"), "ppn-masa");
    expect(ppn?.dueDate).toBe("2026-07-15");
  });

  it("sorts by daysLeft ascending (most urgent first)", () => {
    const ds = computeDeadlines("2026-06-10");
    const days = ds.map((d) => d.daysLeft);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });

  it("buckets severity: <=3 red, <=7 amber, else emerald", () => {
    const red = byId(computeDeadlines("2026-06-10", { dueDates: [{ id: "x", title: "X", dueDate: "2026-06-12" }] }), "x");
    expect(red?.daysLeft).toBe(2);
    expect(red?.severity).toBe("red");
  });

  it("keeps overdue items with negative daysLeft and red severity", () => {
    const overdue = byId(computeDeadlines("2026-06-10", { dueDates: [{ id: "o", title: "O", dueDate: "2026-06-01" }] }), "o");
    expect(overdue?.daysLeft).toBe(-9);
    expect(overdue?.severity).toBe("red");
  });

  it("date-only fallback: returns the statutory deadlines even with no context", () => {
    const ds = computeDeadlines("2026-06-10");
    expect(ds.length).toBeGreaterThanOrEqual(3);
    for (const d of ds) expect(d.to.length).toBeGreaterThan(0);
  });
});
