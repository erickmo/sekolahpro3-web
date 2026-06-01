import { describe, it, expect } from "vitest";
import { isOverdue, summarizeApprovals, splitTransaksiByJenis, capLabel } from "../worklist";

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
      { jenis: "Setor" },
      { jenis: "Setor" },
      { jenis: "Tarik" },
    ]);
    expect(out).toEqual({ Setor: 2, Tarik: 1 });
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
