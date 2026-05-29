import { describe, it, expect } from "vitest";
import { ChargeErrorCode, chargeErrorMessage } from "../error-codes";

describe("error-codes", () => {
  it("maps each code to user message", () => {
    for (const code of Object.values(ChargeErrorCode)) {
      const msg = chargeErrorMessage(code as ChargeErrorCode);
      expect(msg).toBeTypeOf("string");
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it("returns fallback for unknown code", () => {
    expect(chargeErrorMessage("WAT" as ChargeErrorCode)).toMatch(/tidak diketahui/i);
  });
});
