import { describe, it, expect } from "vitest";
import { validateTransaksi, hasActiveSession } from "../transaksiGuard";

describe("validateTransaksi", () => {
  const base = { jenis: "Setor" as const, nominal: 50_000, rekening: "REK-001" };

  it("returns null for a valid Setor", () => {
    expect(validateTransaksi(base)).toBeNull();
  });

  it("rejects nominal of 0", () => {
    expect(validateTransaksi({ ...base, nominal: 0 })).toMatch(/nominal/i);
  });

  it("rejects negative nominal", () => {
    expect(validateTransaksi({ ...base, nominal: -1 })).toMatch(/nominal/i);
  });

  it("rejects NaN nominal", () => {
    expect(validateTransaksi({ ...base, nominal: Number.NaN })).toMatch(/nominal/i);
  });

  it("rejects empty rekening", () => {
    expect(validateTransaksi({ ...base, rekening: "" })).toMatch(/rekening/i);
  });

  it("requires rekening_tujuan for Transfer", () => {
    const err = validateTransaksi({ jenis: "Transfer", nominal: 50_000, rekening: "REK-001" });
    expect(err).toMatch(/tujuan/i);
  });

  it("rejects Transfer to the same rekening", () => {
    const err = validateTransaksi({
      jenis: "Transfer",
      nominal: 50_000,
      rekening: "REK-001",
      rekeningTujuan: "REK-001",
    });
    expect(err).toMatch(/sama/i);
  });

  it("accepts Transfer to a different rekening", () => {
    expect(
      validateTransaksi({
        jenis: "Transfer",
        nominal: 50_000,
        rekening: "REK-001",
        rekeningTujuan: "REK-002",
      }),
    ).toBeNull();
  });

  it("blocks Tarik exceeding known saldo", () => {
    const err = validateTransaksi({ jenis: "Tarik", nominal: 200_000, rekening: "REK-001", saldo: 150_000 });
    expect(err).toMatch(/saldo/i);
  });

  it("allows Tarik within saldo", () => {
    expect(
      validateTransaksi({ jenis: "Tarik", nominal: 100_000, rekening: "REK-001", saldo: 150_000 }),
    ).toBeNull();
  });

  it("does not block Tarik when saldo is unknown", () => {
    expect(validateTransaksi({ jenis: "Tarik", nominal: 999_999, rekening: "REK-001" })).toBeNull();
  });
});

describe("hasActiveSession", () => {
  const sessions = [
    { teller: "kasir@a.id", status: "Aktif" },
    { teller: "kasir@b.id", status: "Selesai" },
  ];

  it("returns true when the user has an Aktif session", () => {
    expect(hasActiveSession(sessions, "kasir@a.id")).toBe(true);
  });

  it("returns false when the user's only session is closed", () => {
    expect(hasActiveSession(sessions, "kasir@b.id")).toBe(false);
  });

  it("returns false when the user has no session", () => {
    expect(hasActiveSession(sessions, "kasir@c.id")).toBe(false);
  });

  it("returns false for empty session list", () => {
    expect(hasActiveSession([], "kasir@a.id")).toBe(false);
  });
});
