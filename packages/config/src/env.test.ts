import { describe, it, expect } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv VITE_API_BASE", () => {
  it("accepts a relative proxy path (e.g. /api)", () => {
    const env = parseEnv({ VITE_API_BASE: "/api", MODE: "development" });
    expect(env.VITE_API_BASE).toBe("/api");
  });

  it("accepts an absolute URL", () => {
    const env = parseEnv({ VITE_API_BASE: "http://localhost:8080", MODE: "development" });
    expect(env.VITE_API_BASE).toBe("http://localhost:8080");
  });

  it("accepts an empty string (same-origin)", () => {
    const env = parseEnv({ VITE_API_BASE: "", MODE: "development" });
    expect(env.VITE_API_BASE).toBe("");
  });

  it("rejects a non-URL, non-relative string", () => {
    expect(() => parseEnv({ VITE_API_BASE: "api", MODE: "development" })).toThrow();
  });

  it("accepts a relative ads base too", () => {
    const env = parseEnv({ VITE_API_BASE: "/api", VITE_ADS_BASE: "/ads", MODE: "development" });
    expect(env.VITE_ADS_BASE).toBe("/ads");
  });
});
