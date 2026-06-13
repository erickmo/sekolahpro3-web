import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { KOPERASI_PAGE_GUIDES, type KoperasiGuideId } from "../pageGuides";
import { KoperasiPageGuide } from "../KoperasiPageGuide";

const EXPECTED_IDS: KoperasiGuideId[] = [
  "dashboard",
  "onboarding",
  "daftar",
  "rekening",
  "transaksi",
  "kas-teller",
  "workspace",
  "kartu",
  "emoney",
  "pembiayaan",
  "angsuran",
  "suku-bunga",
  "nasabah",
  "wallet",
  "zis",
  "zis-penyaluran",
  "zis-program",
  "wakaf",
  "persetujuan",
  "period-close",
  "shu",
  "ppatk",
  "laporan",
  "pengaturan",
];

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("KOPERASI_PAGE_GUIDES content", () => {
  it("has complete, non-empty content for every page", () => {
    for (const id of EXPECTED_IDS) {
      const g = KOPERASI_PAGE_GUIDES[id];
      expect(g, `missing guide for ${id}`).toBeTruthy();
      expect(g.title.length).toBeGreaterThan(0);
      expect(g.intro.length).toBeGreaterThan(0);
      expect(g.steps.length).toBeGreaterThan(0);
      expect(g.tips.length).toBeGreaterThan(0);
    }
  });

  it("only references known koperasi roles in step tags", () => {
    const known = new Set(["teller", "admin", "supervisor"]);
    for (const id of EXPECTED_IDS) {
      for (const step of KOPERASI_PAGE_GUIDES[id].steps) {
        for (const role of step.roles ?? []) {
          expect(known.has(role), `unknown role "${role}" in ${id}`).toBe(true);
        }
      }
    }
  });
});

describe("KoperasiPageGuide", () => {
  it("renders the titled guide for the given page id", () => {
    render(<KoperasiPageGuide id="dashboard" />);
    expect(screen.getByText(KOPERASI_PAGE_GUIDES.dashboard.title)).toBeTruthy();
  });

  it("renders a koperasi role label resolved from the page's role tags", () => {
    render(<KoperasiPageGuide id="workspace" />);
    // Every workspace step is framed for the teller (one badge per tagged step).
    expect(screen.getAllByText("Teller").length).toBeGreaterThan(0);
  });
});
