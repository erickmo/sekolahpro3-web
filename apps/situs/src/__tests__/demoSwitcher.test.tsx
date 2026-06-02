import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { applyDemoTemplate, TEMPLATE_PRESETS } from "../demo/templatePresets";
import { DemoSwitcher } from "../demo/DemoSwitcher";
import { demoSite } from "../data/demo-site";
import { BLOCK_TYPES, TEMPLATE_KEYS } from "../constants";

const HERO_BY_TEMPLATE: Record<string, string> = {
  klasik: "split",
  modern: "centered",
  ceria: "playful",
  aurora: "fullbleed",
};

describe("applyDemoTemplate", () => {
  it("overrides templateKey, theme and layout while keeping resolved content", () => {
    const out = applyDemoTemplate(demoSite, "ceria");
    expect(out.templateKey).toBe("ceria");
    expect(out.theme.heroVariant).toBe("playful");
    expect(out.theme.sectionStyle).toBe("card");
    expect(out.layoutBlocks[0]).toMatchObject({ tipe: "hero", variant: "playful", aktif: true });
    // content preserved (not wiped by the preset)
    expect(out.brand).toBe(demoSite.brand);
    expect(out.keunggulan).toBe(demoSite.keunggulan);
    expect(out.nama).toBe(demoSite.nama);
  });

  it("every template preset leads with its hero variant and uses valid block types", () => {
    for (const key of TEMPLATE_KEYS) {
      const out = applyDemoTemplate(demoSite, key);
      expect(out.templateKey).toBe(key);
      expect(out.layoutBlocks[0]).toMatchObject({ tipe: "hero", variant: HERO_BY_TEMPLATE[key] });
      for (const b of out.layoutBlocks) {
        expect(BLOCK_TYPES).toContain(b.tipe);
        expect(b.aktif).toBe(true);
      }
    }
  });
});

describe("DemoSwitcher", () => {
  it("renders a button per template and marks the current one", () => {
    render(<DemoSwitcher current="modern" onPick={() => {}} />);
    expect(screen.getByRole("button", { name: "Klasik" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aurora" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Modern" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Klasik" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("calls onPick with the chosen template key", () => {
    const picked: string[] = [];
    render(<DemoSwitcher current="klasik" onPick={(k) => picked.push(k)} />);
    fireEvent.click(screen.getByRole("button", { name: "Ceria" }));
    expect(picked).toEqual(["ceria"]);
  });

  it("exposes all four templates", () => {
    expect(Object.keys(TEMPLATE_PRESETS).sort()).toEqual([...TEMPLATE_KEYS].sort());
  });
});
