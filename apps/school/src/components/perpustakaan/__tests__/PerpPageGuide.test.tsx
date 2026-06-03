import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PERP_PAGE_GUIDES, type PerpGuideId } from "../pageGuides";
import { PerpPageGuide } from "../PerpPageGuide";

const EXPECTED_IDS: PerpGuideId[] = [
  "terminal",
  "peminjaman",
  "daftar",
  "kategori",
  "reservasi",
  "pengadaan",
  "anggota",
  "laporan",
  "inventaris",
  "denda",
  "pengembalian",
  "kolektif",
  "inventaris-berita-acara",
  "inventaris-opname",
];

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("PERP_PAGE_GUIDES content", () => {
  it("has complete, non-empty content for every page", () => {
    for (const id of EXPECTED_IDS) {
      const g = PERP_PAGE_GUIDES[id];
      expect(g, `missing guide for ${id}`).toBeTruthy();
      expect(g.title.length).toBeGreaterThan(0);
      expect(g.intro.length).toBeGreaterThan(0);
      expect(g.steps.length).toBeGreaterThan(0);
      expect(g.tips.length).toBeGreaterThan(0);
    }
  });

  it("only references known library roles in step tags", () => {
    const known = new Set(["petugas", "pustakawan", "admin"]);
    for (const id of EXPECTED_IDS) {
      for (const step of PERP_PAGE_GUIDES[id].steps) {
        for (const role of step.roles ?? []) {
          expect(known.has(role), `unknown role "${role}" in ${id}`).toBe(true);
        }
      }
    }
  });
});

describe("PerpPageGuide", () => {
  it("renders the titled guide for the given page id", () => {
    render(<PerpPageGuide id="terminal" />);
    expect(screen.getByText(PERP_PAGE_GUIDES.terminal.title)).toBeTruthy();
  });

  it("renders a library role label resolved from the page's role tags", () => {
    render(<PerpPageGuide id="peminjaman" />);
    // Peminjaman guide is framed for the circulation desk (one badge per tagged step).
    expect(screen.getAllByText("Petugas Sirkulasi").length).toBeGreaterThan(0);
  });
});
