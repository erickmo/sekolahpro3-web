import { describe, expect, it } from "vitest";
import { deriveIsSyariah } from "./useKoperasiMode";

describe("deriveIsSyariah", () => {
  it("Syariah (BMT) → true", () => expect(deriveIsSyariah("Syariah (BMT)")).toBe(true));
  it("Konvensional → false", () => expect(deriveIsSyariah("Konvensional")).toBe(false));
  it("undefined → true (superset fallback)", () => expect(deriveIsSyariah(undefined)).toBe(true));
  it("empty/unknown → true (superset fallback)", () => expect(deriveIsSyariah("")).toBe(true));
});
