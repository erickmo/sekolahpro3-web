import { describe, it, expect } from "vitest";
import { parseEnv } from "../src/env";

describe("parseEnv", () => {
  it("parses a valid env", () => {
    const env = parseEnv({ VITE_API_BASE: "https://api.sekolahpro.id", MODE: "production" });
    expect(env.VITE_API_BASE).toBe("https://api.sekolahpro.id");
    expect(env.MODE).toBe("production");
  });

  it("rejects a missing API base", () => {
    expect(() => parseEnv({ MODE: "development" })).toThrow(/VITE_API_BASE/);
  });

  it("rejects a non-URL API base", () => {
    expect(() => parseEnv({ VITE_API_BASE: "not-a-url", MODE: "development" })).toThrow();
  });

  it("allows an empty API base for same-origin", () => {
    const env = parseEnv({ VITE_API_BASE: "", MODE: "development" });
    expect(env.VITE_API_BASE).toBe("");
  });
});
