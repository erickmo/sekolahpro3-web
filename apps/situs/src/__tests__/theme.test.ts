import { describe, expect, it } from "vitest";
import { computeThemeVars, hexToRgb, readableOn, computeTemplateVars } from "../theme";
import type { SiteTheme } from "../types";

describe("theme", () => {
  it("parses hex to rgb", () => {
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
    expect(hexToRgb("#000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#0e7490")).toEqual([14, 116, 144]);
  });

  it("picks dark text on light bg, white text on dark bg", () => {
    expect(readableOn("#ffffff")).toBe("#111827");
    expect(readableOn("#0e7490")).toBe("#ffffff");
  });

  it("computes brand CSS vars from a valid color", () => {
    const vars = computeThemeVars({ color: "#0e7490", color2: "#f59e0b", logo: null, favicon: null, heroImage: null });
    expect(vars["--situs-brand"]).toBe("#0e7490");
    expect(vars["--situs-brand-2"]).toBe("#f59e0b");
    expect(vars["--situs-brand-fg"]).toBe("#ffffff");
    expect(vars["--situs-brand-rgb"]).toBe("14, 116, 144");
  });

  it("falls back to a safe brand when color is invalid/empty", () => {
    const vars = computeThemeVars({ color: "", color2: "nonsense", logo: null, favicon: null, heroImage: null });
    expect(vars["--situs-brand"]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(vars["--situs-brand-2"]).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("computeTemplateVars", () => {
  const full: SiteTheme = {
    heroVariant: "overlay",
    radius: "16px",
    fontHeading: "Poppins",
    fontBody: "Inter",
    shadow: "0 10px 30px rgba(0,0,0,.2)",
    sectionStyle: "flat",
  };

  it("emits CSS vars for every provided token", () => {
    const vars = computeTemplateVars(full);
    expect(vars["--situs-radius"]).toBe("16px");
    expect(vars["--situs-heading-font"]).toBe("Poppins");
    expect(vars["--situs-body-font"]).toBe("Inter");
    expect(vars["--situs-card-shadow"]).toBe("0 10px 30px rgba(0,0,0,.2)");
    expect(vars["--situs-section-style"]).toBe("flat");
  });

  it("omits a var when its token is empty so skins.css remains the fallback", () => {
    const vars = computeTemplateVars({
      heroVariant: "split",
      radius: "",
      fontHeading: "",
      fontBody: "",
      shadow: "",
      sectionStyle: "card",
    });
    expect(vars["--situs-radius"]).toBeUndefined();
    expect(vars["--situs-heading-font"]).toBeUndefined();
    expect(vars["--situs-card-shadow"]).toBeUndefined();
    // sectionStyle is an enum (never empty) so it is always emitted.
    expect(vars["--situs-section-style"]).toBe("card");
  });
});
