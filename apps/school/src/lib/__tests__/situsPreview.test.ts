// buildPreviewUrl encodes an unsaved draft into the situs preview-app URL so the
// renderer can overlay it (never targets the live subdomain).
import { describe, expect, it } from "vitest";
import { buildPreviewUrl, situsPreviewUrl } from "../situsPreview";

describe("buildPreviewUrl", () => {
  it("targets the preview app and round-trips the draft via the preview param", () => {
    const url = buildPreviewUrl("smp-demo", { template: "modern", layout_blocks: [{ tipe: "hero" }] });
    const u = new URL(url);
    expect(u.searchParams.get("sekolah")).toBe("smp-demo");
    const draft = JSON.parse(u.searchParams.get("preview") ?? "null");
    expect(draft.template).toBe("modern");
    expect(draft.layout_blocks[0].tipe).toBe("hero");
  });

  it("does not use a live subdomain (preview is same-origin only)", () => {
    const url = buildPreviewUrl("smp-demo", { template: "klasik" });
    expect(url).not.toContain("smp-demo.");
  });
});

describe("situsPreviewUrl (unchanged published-link behavior)", () => {
  it("uses the subdomain host when one is set", () => {
    expect(situsPreviewUrl("smp-pelita", "smp-demo")).toContain("smp-pelita.");
  });
});
