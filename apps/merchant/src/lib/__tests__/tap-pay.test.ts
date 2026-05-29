import { describe, it, expect, vi } from "vitest";
import { tapPay } from "../tap-pay";
import { ChargeError } from "../merchant-api";
import { ChargeErrorCode } from "../error-codes";

function makeToken(kartu = "KARTU-001") {
  return btoa(JSON.stringify({
    kartu_id: kartu, nonce: "n", exp: Math.floor(Date.now()/1000)+60, hmac: "h",
  })).replace(/=+$/, "");
}

describe("tapPay", () => {
  it("happy path returns receipt", async () => {
    const api = { charge: vi.fn().mockResolvedValue({ txn_name: "T1", nama_siswa: "Andi", balance_after: 35000, void_deadline_iso: "x" }) };
    const idem = { next: vi.fn().mockReturnValue("idem-1") };
    const res = await tapPay({
      api, idempotency: idem,
      input: { terminal_id: "T", card_token: makeToken(), items: [{ name: "I-001", qty: 1 }], amount: 15000 },
    });
    expect(res.kind).toBe("ok");
    expect(api.charge).toHaveBeenCalledWith(expect.objectContaining({ idempotency_key: "idem-1" }));
  });

  it("maps ChargeError to error result", async () => {
    const api = { charge: vi.fn().mockRejectedValue(new ChargeError(ChargeErrorCode.INSUFFICIENT_FUNDS)) };
    const idem = { next: vi.fn().mockReturnValue("idem-2") };
    const res = await tapPay({
      api, idempotency: idem,
      input: { terminal_id: "T", card_token: makeToken(), items: [], amount: 15000 },
    });
    expect(res.kind).toBe("error");
    if (res.kind === "error") expect(res.code).toBe(ChargeErrorCode.INSUFFICIENT_FUNDS);
  });

  it("retries on network error w/ same idempotency_key", async () => {
    const charge = vi.fn()
      .mockRejectedValueOnce(new ChargeError(ChargeErrorCode.NETWORK))
      .mockResolvedValueOnce({ txn_name: "T2", nama_siswa: "X", balance_after: 0, void_deadline_iso: "x" });
    const idem = { next: vi.fn().mockReturnValue("idem-3") };
    const res = await tapPay({
      api: { charge }, idempotency: idem, retryDelayMs: 0,
      input: { terminal_id: "T", card_token: makeToken(), items: [], amount: 1 },
    });
    expect(res.kind).toBe("ok");
    expect(charge).toHaveBeenCalledTimes(2);
    expect(charge.mock.calls[0][0].idempotency_key).toBe("idem-3");
    expect(charge.mock.calls[1][0].idempotency_key).toBe("idem-3");
  });
});
