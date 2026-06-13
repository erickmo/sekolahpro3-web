import { describe, it, expect } from "vitest";
import { validateTransaksi, hasActiveSession } from "../transaksiGuard";

// Jenis values mirror the backend Transaksi Simpanan Select exactly
// (Setoran|Penarikan|Bagi Hasil) — the old UI-only vocabulary
// (Setor/Tarik/Transfer/Koreksi) never matched a backend row.
describe("validateTransaksi", () => {
  const base = { jenis: "Setoran" as const, nominal: 50_000, rekening: "REK-001" };

  it("returns null for a valid Setoran", () => {
    expect(validateTransaksi(base)).toBeNull();
  });

  it("requires rekening", () => {
    expect(validateTransaksi({ ...base, rekening: "  " })).toMatch(/rekening/i);
  });

  it("rejects zero / negative / NaN nominal", () => {
    for (const nominal of [0, -10, Number.NaN]) {
      expect(validateTransaksi({ ...base, nominal })).toMatch(/nominal/i);
    }
  });

  it("blocks Penarikan exceeding known saldo", () => {
    expect(
      validateTransaksi({ jenis: "Penarikan", nominal: 150_000, rekening: "REK-1", saldo: 100_000 }),
    ).toMatch(/saldo/i);
  });

  it("allows Penarikan within saldo", () => {
    expect(
      validateTransaksi({ jenis: "Penarikan", nominal: 50_000, rekening: "REK-1", saldo: 100_000 }),
    ).toBeNull();
  });

  it("does not block Penarikan when saldo is unknown", () => {
    expect(
      validateTransaksi({ jenis: "Penarikan", nominal: 150_000, rekening: "REK-1" }),
    ).toBeNull();
  });

  it("accepts Bagi Hasil (book-only, no cash gate here)", () => {
    expect(
      validateTransaksi({ jenis: "Bagi Hasil", nominal: 10_000, rekening: "REK-1" }),
    ).toBeNull();
  });
});

describe("hasActiveSession", () => {
  it("is true only for the user's own Aktif session", () => {
    const rows = [
      { teller: "a@x.id", status: "Closed" },
      { teller: "b@x.id", status: "Aktif" },
    ];
    expect(hasActiveSession(rows, "b@x.id")).toBe(true);
    expect(hasActiveSession(rows, "a@x.id")).toBe(false);
    expect(hasActiveSession([], "a@x.id")).toBe(false);
  });
});
