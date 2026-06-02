// Composer drives the homepage from site.layoutBlocks: order is respected,
// inactive blocks are skipped, and an empty list falls back to the chosen
// template's default HomeBody composition (no blank page).

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { Composer } from "../templates/Composer";
import { demoSite } from "../data/demo-site";
import type { SiteData } from "../types";
import { renderWithSite } from "./test-utils";

afterEach(cleanup);

function withBlocks(blocks: SiteData["layoutBlocks"]): SiteData {
  return { ...demoSite, layoutBlocks: blocks };
}

describe("Composer", () => {
  it("renders blocks in the configured order", () => {
    renderWithSite(
      <Composer />,
      withBlocks([
        { tipe: "richtext", variant: "default", aktif: true, konten: "<p>FIRST</p>" },
        { tipe: "richtext", variant: "default", aktif: true, konten: "<p>SECOND</p>" },
      ]),
    );
    const first = screen.getByText("FIRST");
    const second = screen.getByText("SECOND");
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("skips inactive blocks", () => {
    renderWithSite(
      <Composer />,
      withBlocks([
        { tipe: "richtext", variant: "default", aktif: false, konten: "<p>HIDDEN</p>" },
        { tipe: "richtext", variant: "default", aktif: true, konten: "<p>SHOWN</p>" },
      ]),
    );
    expect(screen.queryByText("HIDDEN")).toBeNull();
    expect(screen.getByText("SHOWN")).toBeInTheDocument();
  });

  it("falls back to the template default layout when no blocks are configured", () => {
    // demoSite.templateKey === "klasik" => KlasikHome leads with the Hero.
    renderWithSite(<Composer />, withBlocks([]));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(demoSite.profil.heroJudul);
  });
});
