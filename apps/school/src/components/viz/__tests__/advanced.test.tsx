/**
 * Tests untuk primitif visualisasi lanjutan (FunnelChart, GaugeArc, TrendArea).
 * Memverifikasi: setiap chart merender SVG dengan role="img" + aria-label yang
 * meringkas data, tidak melempar pada input kosong/nol, dan merefleksikan nilai
 * (mis. teks persen gauge, hitungan funnel, jumlah titik area).
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FunnelChart, GaugeArc, TrendArea } from "../advanced";
import type { FunnelStage } from "../advanced";

afterEach(() => cleanup());

/* ------------------------------------------------------------------ */
/* FunnelChart                                                         */
/* ------------------------------------------------------------------ */

describe("FunnelChart", () => {
  const stages: FunnelStage[] = [
    { label: "Pendaftar", value: 100, tone: "brand" },
    { label: "Tes", value: 60, tone: "sky" },
    { label: "Lulus", value: 30, tone: "emerald" },
  ];

  it("merender SVG role=img dengan aria-label berisi label & nilai setiap tahap", () => {
    render(<FunnelChart stages={stages} />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    const label = img.getAttribute("aria-label") ?? "";
    expect(label).toMatch(/Pendaftar/);
    expect(label).toMatch(/100/);
    expect(label).toMatch(/Lulus/);
    expect(label).toMatch(/30/);
  });

  it("menampilkan hitungan setiap tahap sebagai teks", () => {
    render(<FunnelChart stages={stages} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("menampilkan persen relatif terhadap tahap pertama", () => {
    render(<FunnelChart stages={stages} />);
    // 30 dari 100 -> 30%
    expect(screen.getByText(/30%/)).toBeInTheDocument();
    // 60 dari 100 -> 60%
    expect(screen.getByText(/60%/)).toBeInTheDocument();
  });

  it("tidak melempar pada daftar tahap kosong dan menandai tanpa data", () => {
    expect(() => render(<FunnelChart stages={[]} />)).not.toThrow();
    expect(screen.getByRole("img").getAttribute("aria-label")).toMatch(/tanpa data/i);
  });

  it("tidak melempar saat semua nilai nol", () => {
    const zero: FunnelStage[] = [
      { label: "A", value: 0 },
      { label: "B", value: 0 },
    ];
    expect(() => render(<FunnelChart stages={zero} />)).not.toThrow();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("meneruskan className ke kontainer", () => {
    const { container } = render(<FunnelChart stages={stages} className="mt-7" />);
    expect(container.querySelector(".mt-7")).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* GaugeArc                                                            */
/* ------------------------------------------------------------------ */

describe("GaugeArc", () => {
  it("merender SVG role=img dengan aria-label menyebut nilai, max, dan persen", () => {
    render(<GaugeArc value={45} max={90} />);
    const img = screen.getByRole("img");
    const label = img.getAttribute("aria-label") ?? "";
    expect(label).toMatch(/45/);
    expect(label).toMatch(/90/);
    expect(label).toMatch(/50/); // 45/90 = 50%
  });

  it("menampilkan teks nilai/max dan persen di tengah", () => {
    render(<GaugeArc value={45} max={90} />);
    expect(screen.getByText(/45/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it("menjepit nilai melebihi max menjadi 100 persen", () => {
    render(<GaugeArc value={200} max={50} />);
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it("tidak melempar dan persen 0 saat max nol", () => {
    expect(() => render(<GaugeArc value={10} max={0} />)).not.toThrow();
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it("menjepit nilai negatif menjadi 0 persen", () => {
    render(<GaugeArc value={-5} max={100} />);
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it("merender label opsional", () => {
    render(<GaugeArc value={1} max={2} label="Kuota" />);
    expect(screen.getByText("Kuota")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* TrendArea                                                           */
/* ------------------------------------------------------------------ */

describe("TrendArea", () => {
  it("merender SVG role=img dengan aria-label menyebut jumlah titik", () => {
    render(<TrendArea points={[1, 2, 3, 4]} />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("aria-label")).toMatch(/4 titik/);
  });

  it("menandai tanpa data saat titik kurang dari dua", () => {
    render(<TrendArea points={[5]} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toMatch(/tanpa data/i);
  });

  it("tidak melempar pada array kosong", () => {
    expect(() => render(<TrendArea points={[]} />)).not.toThrow();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("tidak melempar saat semua titik bernilai sama", () => {
    expect(() => render(<TrendArea points={[3, 3, 3]} />)).not.toThrow();
  });

  it("merender label sumbu x bila disediakan", () => {
    render(<TrendArea points={[1, 2, 3]} labels={["Sen", "Sel", "Rab"]} />);
    expect(screen.getByText("Sen")).toBeInTheDocument();
    expect(screen.getByText("Rab")).toBeInTheDocument();
  });

  it("meneruskan className ke SVG", () => {
    const { container } = render(<TrendArea points={[1, 2]} className="text-brand" />);
    expect(container.querySelector(".text-brand")).toBeTruthy();
  });
});
