import { describe, it, expect } from "vitest";
import {
  isOverdue,
  summarizeApprovals,
  splitTransaksiByJenis,
  capLabel,
  countDueWithin,
  splitByStatus,
  isPeriodePastDue,
} from "../worklist";

describe("isOverdue", () => {
  const today = "2026-06-02";

  it("is overdue when status Belum and due date before today", () => {
    expect(isOverdue({ status: "Belum", tanggal_jatuh_tempo: "2026-05-30" }, today)).toBe(true);
  });

  it("is not overdue when due date is today", () => {
    expect(isOverdue({ status: "Belum", tanggal_jatuh_tempo: today }, today)).toBe(false);
  });

  it("is not overdue when due date is in the future", () => {
    expect(isOverdue({ status: "Belum", tanggal_jatuh_tempo: "2026-07-01" }, today)).toBe(false);
  });

  it("is not overdue when already Lunas", () => {
    expect(isOverdue({ status: "Lunas", tanggal_jatuh_tempo: "2026-05-30" }, today)).toBe(false);
  });

  it("is not overdue when due date missing", () => {
    expect(isOverdue({ status: "Belum" }, today)).toBe(false);
  });
});

describe("summarizeApprovals", () => {
  it("totals counts and keeps per-type breakdown", () => {
    const out = summarizeApprovals([
      { key: "buka", count: 3 },
      { key: "tutup", count: 1 },
      { key: "blokir", count: 0 },
    ]);
    expect(out.total).toBe(4);
    expect(out.byType).toEqual({ buka: 3, tutup: 1, blokir: 0 });
  });

  it("returns zero total for empty input", () => {
    expect(summarizeApprovals([]).total).toBe(0);
  });
});

describe("splitTransaksiByJenis", () => {
  it("counts rows per jenis", () => {
    const out = splitTransaksiByJenis([
      { jenis: "Setoran" },
      { jenis: "Setoran" },
      { jenis: "Penarikan" },
    ]);
    expect(out).toEqual({ Setoran: 2, Penarikan: 1 });
  });

  it("returns empty map for no rows", () => {
    expect(splitTransaksiByJenis([])).toEqual({});
  });
});

describe("capLabel", () => {
  it("shows the raw count below the cap", () => {
    expect(capLabel(42, 100)).toBe("42");
  });

  it("shows cap+ when at or above the cap", () => {
    expect(capLabel(100, 100)).toBe("100+");
    expect(capLabel(250, 100)).toBe("100+");
  });
});

describe("countDueWithin", () => {
  const today = "2026-06-02";

  it("counts Belum rows due from today through the horizon", () => {
    const rows = [
      { status: "Belum", tanggal_jatuh_tempo: "2026-06-02" }, // today: in
      { status: "Belum", tanggal_jatuh_tempo: "2026-06-09" }, // horizon edge: in
      { status: "Belum", tanggal_jatuh_tempo: "2026-06-10" }, // past horizon: out
      { status: "Belum", tanggal_jatuh_tempo: "2026-06-01" }, // already overdue: out
      { status: "Lunas", tanggal_jatuh_tempo: "2026-06-03" }, // paid: out
      { status: "Belum" }, // no due date: out
    ];
    expect(countDueWithin(rows, today, 7)).toBe(2);
  });

  it("crosses month boundaries correctly", () => {
    expect(
      countDueWithin([{ status: "Belum", tanggal_jatuh_tempo: "2026-07-01" }], "2026-06-29", 7),
    ).toBe(1);
  });

  it("returns zero for empty input", () => {
    expect(countDueWithin([], today, 7)).toBe(0);
  });
});

describe("splitByStatus", () => {
  it("counts rows per status and skips missing status", () => {
    const out = splitByStatus([
      { status: "Draft" },
      { status: "Draft" },
      { status: "Rejected" },
      {},
    ]);
    expect(out).toEqual({ Draft: 2, Rejected: 1 });
  });

  it("returns empty map for no rows", () => {
    expect(splitByStatus([])).toEqual({});
  });
});

describe("isPeriodePastDue", () => {
  const today = "2026-06-02";

  it("flags an Open period whose end date has passed", () => {
    expect(isPeriodePastDue({ status: "Open", tanggal_akhir: "2026-05-31" }, today)).toBe(true);
  });

  it("does not flag an Open period still inside its range", () => {
    expect(isPeriodePastDue({ status: "Open", tanggal_akhir: "2026-06-30" }, today)).toBe(false);
  });

  it("does not flag a period ending today", () => {
    expect(isPeriodePastDue({ status: "Open", tanggal_akhir: today }, today)).toBe(false);
  });

  it("ignores Closed/Reopened periods and rows without an end date", () => {
    expect(isPeriodePastDue({ status: "Closed", tanggal_akhir: "2026-05-31" }, today)).toBe(false);
    expect(isPeriodePastDue({ status: "Open" }, today)).toBe(false);
  });
});
