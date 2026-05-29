import { describe, it, expect } from "vitest";
import { merchantApi } from "../merchant-api";

describe("merchantApi", () => {
  it("getCatalog returns items", async () => {
    const items = await merchantApi.getCatalog();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty("nama");
  });

  it("charge happy path", async () => {
    const token = btoa(
      JSON.stringify({
        kartu_id: "KARTU-001",
        nonce: "n",
        exp: Math.floor(Date.now() / 1000) + 60,
        hmac: "h",
      }),
    ).replace(/=+$/, "");
    const res = await merchantApi.charge({
      terminal_id: "T-1",
      card_token: token,
      items: [{ name: "I-001", qty: 1 }],
      amount: 15000,
      idempotency_key: crypto.randomUUID(),
    });
    expect(res.txn_name).toMatch(/^EMT-/);
    expect(res.balance_after).toBeGreaterThanOrEqual(0);
  });

  it("charge rejects insufficient funds", async () => {
    const token = btoa(
      JSON.stringify({
        kartu_id: "KARTU-002",
        nonce: "n2",
        exp: Math.floor(Date.now() / 1000) + 60,
        hmac: "h",
      }),
    ).replace(/=+$/, "");
    await expect(
      merchantApi.charge({
        terminal_id: "T-1",
        card_token: token,
        items: [{ name: "I-001", qty: 1 }],
        amount: 99999,
        idempotency_key: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });
  });
});
