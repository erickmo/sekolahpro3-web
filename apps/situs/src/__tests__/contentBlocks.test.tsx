// Content-block render contract. The data-driven blocks (Keunggulan/Statistik/
// Testimoni) read their rows from the site context; Cta + RichText render from
// the block's own fields. Each must surface its key content for the CMS preview.

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { KeunggulanBlock } from "../templates/blocks/KeunggulanBlock";
import { StatistikBlock } from "../templates/blocks/StatistikBlock";
import { TestimoniBlock } from "../templates/blocks/TestimoniBlock";
import { CtaBlock } from "../templates/blocks/CtaBlock";
import { RichTextBlock } from "../templates/blocks/RichTextBlock";
import { demoSite } from "../data/demo-site";
import type { LayoutBlock, SiteData } from "../types";
import { renderWithSite } from "./test-utils";

afterEach(cleanup);

const site: SiteData = {
  ...demoSite,
  keunggulan: [{ ikon: "award", judul: "Akreditasi A", deskripsi: "Unggul" }],
  statistik: [{ label: "Siswa", nilai: "1200", satuan: "anak" }],
  testimoni: [{ nama: "Budi", peran: "Alumni", kutipan: "Sekolah terbaik" }],
};
const b = (over: Partial<LayoutBlock> = {}): LayoutBlock => ({ tipe: "keunggulan", variant: "default", aktif: true, ...over });

describe("content blocks", () => {
  it("KeunggulanBlock renders each keunggulan row", () => {
    renderWithSite(<KeunggulanBlock block={b({ judul: "Mengapa Kami" })} />, site);
    expect(screen.getByText("Akreditasi A")).toBeInTheDocument();
    expect(screen.getByText("Unggul")).toBeInTheDocument();
  });

  it("StatistikBlock renders value + label + satuan", () => {
    renderWithSite(<StatistikBlock block={b({ tipe: "statistik" })} />, site);
    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getByText("Siswa")).toBeInTheDocument();
    expect(screen.getByText(/anak/)).toBeInTheDocument();
  });

  it("TestimoniBlock renders the quote + name", () => {
    renderWithSite(<TestimoniBlock block={b({ tipe: "testimoni" })} />, site);
    expect(screen.getByText(/Sekolah terbaik/)).toBeInTheDocument();
    expect(screen.getByText("Budi")).toBeInTheDocument();
  });

  it("CtaBlock renders a heading + CTA link", () => {
    renderWithSite(<CtaBlock block={b({ tipe: "cta", judul: "Ayo Daftar", ctaLabel: "Daftar", ctaUrl: "/ppdb" })} />, site);
    expect(screen.getByText("Ayo Daftar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Daftar" })).toHaveAttribute("href", "/ppdb");
  });

  it("RichTextBlock renders sanitized HTML konten", () => {
    renderWithSite(<RichTextBlock block={b({ tipe: "richtext", konten: "<p>Halo Dunia</p>" })} />, site);
    expect(screen.getByText("Halo Dunia")).toBeInTheDocument();
  });
});
