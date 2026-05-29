import { describe, it, expect } from "vitest";
import { merchantApi, ChargeError } from "../lib/merchant-api";
import { ChargeErrorCode } from "../lib/error-codes";

function tokenFor(kartu: string, expOffsetSec = 60) {
  return btoa(
    JSON.stringify({
      kartu_id: kartu,
      nonce: crypto.randomUUID(),
      exp: Math.floor(Date.now() / 1000) + expOffsetSec,
      hmac: "h",
    }),
  )
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

describe("POS flow integration (MSW)", () => {
  it("catalog lists fixtures", async () => {
    const items = await merchantApi.getCatalog();
    expect(items.length).toBeGreaterThan(0);
    expect(items.find((i) => i.nama === "Nasi Ayam")).toBeTruthy();
  });

  it("charge happy path returns receipt", async () => {
    const res = await merchantApi.charge({
      terminal_id: "TERM-M-001-00001",
      card_token: tokenFor("KARTU-001"),
      items: [{ name: "I-001", qty: 1 }],
      amount: 15000,
      idempotency_key: crypto.randomUUID(),
    });
    expect(res.txn_name).toMatch(/^EMT-/);
    expect(res.nama_siswa).toBe("Andi");
    expect(res.balance_after).toBeGreaterThanOrEqual(0);
  });

  it("charge rejects insufficient funds", async () => {
    await expect(
      merchantApi.charge({
        terminal_id: "TERM-M-001-00001",
        card_token: tokenFor("KARTU-002"),
        items: [{ name: "I-001", qty: 1 }],
        amount: 99999,
        idempotency_key: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ code: ChargeErrorCode.INSUFFICIENT_FUNDS });
  });

  it("idempotency_key replay returns cached transaction", async () => {
    const idem = crypto.randomUUID();
    const first = await merchantApi.charge({
      terminal_id: "TERM-M-001-00001",
      card_token: tokenFor("KARTU-001"),
      items: [{ name: "I-001", qty: 1 }],
      amount: 5000,
      idempotency_key: idem,
    });
    const replay = await merchantApi.charge({
      terminal_id: "TERM-M-001-00001",
      card_token: tokenFor("KARTU-001"),
      items: [{ name: "I-001", qty: 1 }],
      amount: 5000,
      idempotency_key: idem,
    });
    expect(replay.txn_name).toBe(first.txn_name);
    expect(replay.replayed).toBe(true);
  });

  it("void within window refunds saldo", async () => {
    const charged = await merchantApi.charge({
      terminal_id: "TERM-M-001-00001",
      card_token: tokenFor("KARTU-001"),
      items: [{ name: "I-001", qty: 1 }],
      amount: 1000,
      idempotency_key: crypto.randomUUID(),
    });
    const result = await merchantApi.void(charged.txn_name, "operator request");
    expect(result.ok).toBe(true);
  });

  it("ChargeError exposes code field", () => {
    const err = new ChargeError(ChargeErrorCode.NETWORK);
    expect(err.code).toBe(ChargeErrorCode.NETWORK);
    expect(err).toBeInstanceOf(Error);
  });
});
