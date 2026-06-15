import { describe, it, expect } from "vitest";
import { buildSppStep } from "./onboarding";

describe("buildSppStep", () => {
  it("links to struktur biaya and is undone with no components", () => {
    expect(buildSppStep(0)).toMatchObject({
      id: "spp",
      href: "/keuangan/biaya",
      done: false,
    });
  });

  it("is done once any fee component exists", () => {
    expect(buildSppStep(2).done).toBe(true);
  });
});
