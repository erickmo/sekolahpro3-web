import { describe, expect, it } from "vitest";
import { TEMPLATE_KEYS } from "../constants";
import { TEMPLATE_REGISTRY, getTemplate } from "../templates/registry";

// Enforces the BE↔FE contract (plan D8): every registered template uses a known
// key, and the registry covers exactly the declared TEMPLATE_KEYS.
describe("template registry contract", () => {
  it("registry keys are exactly TEMPLATE_KEYS", () => {
    expect(Object.keys(TEMPLATE_REGISTRY).sort()).toEqual([...TEMPLATE_KEYS].sort());
  });

  it("each template def declares its own key and a skin class", () => {
    for (const key of TEMPLATE_KEYS) {
      const def = TEMPLATE_REGISTRY[key];
      expect(def.key).toBe(key);
      expect(def.themeClass).toMatch(/^tpl-/);
      expect(typeof def.HomeBody).toBe("function");
    }
  });

  it("getTemplate falls back to the default for an unknown key", () => {
    // @ts-expect-error testing runtime guard with an invalid key
    expect(getTemplate("nope").key).toBe("klasik");
  });

  it("aurora is a first-class template with its own skin class", () => {
    const def = getTemplate("aurora");
    expect(def.key).toBe("aurora");
    expect(def.themeClass).toBe("tpl-aurora");
  });
});
