import { describe, it, expect } from "vitest";
import { getMerchantContext, type MerchantClaims } from "../merchant-session";

describe("getMerchantContext", () => {
  it("returns merchant + terminal from claims", () => {
    const ctx = getMerchantContext({
      merchant_id: "M-001",
      terminal_id: "TERM-M-001-00001",
      operator_user: "kasir@example.com",
      void_window_minutes: 10,
    });
    expect(ctx).toEqual({
      merchantId: "M-001",
      terminalId: "TERM-M-001-00001",
      operatorUser: "kasir@example.com",
      voidWindowMinutes: 10,
    });
  });

  it("throws when claims missing merchant", () => {
    expect(() => getMerchantContext({} as unknown as MerchantClaims)).toThrow(/merchant/i);
  });
});
