import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { App } from "../App";
import { Hero } from "../sections/Hero";
import { BeritaPreview } from "../sections/BeritaPreview";
import { demoSite } from "../data/demo-site";
import { renderApp, renderWithSite } from "./test-utils";

describe("site resolution (offline → demo)", () => {
  it("renders the demo school once resolved", async () => {
    renderApp(<App />, "/");
    // resolveSiteData fails to reach a backend in tests and falls back to demo.
    await waitFor(() => {
      expect(screen.getAllByText(demoSite.nama).length).toBeGreaterThan(0);
    });
  });
});

describe("Hero variants", () => {
  it("renders the hero title for the klasik variant", () => {
    renderWithSite(<Hero variant="klasik" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(demoSite.profil.heroJudul);
  });

  it("renders a hero CTA linking to PPDB", () => {
    renderWithSite(<Hero variant="modern" />);
    const cta = screen.getByRole("link", { name: demoSite.profil.heroCtaLabel });
    expect(cta).toHaveAttribute("href", "/ppdb");
  });
});

describe("BeritaPreview", () => {
  it("renders demo news cards + section chrome when offline", async () => {
    renderWithSite(<BeritaPreview />);
    expect(screen.getByText("Berita & Pengumuman")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("PPDB 2026/2027 Resmi Dibuka")).toBeInTheDocument();
    });
    const region = screen.getByText("Berita & Pengumuman").closest("section") as HTMLElement;
    expect(within(region).getByText(/Lihat semua/)).toBeInTheDocument();
  });
});
