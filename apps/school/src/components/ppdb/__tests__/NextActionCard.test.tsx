/**
 * Tests untuk NextActionCard — kartu "Langkah berikutnya" yang menonjolkan
 * satu aksi prioritas. Memverifikasi render label/deskripsi, pemanggilan
 * renderLink dengan href yang benar, dan null-render saat tidak ada aksi.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { NextActionCard, type NextAction } from "../NextActionCard";

// Sample action dipakai ulang di beberapa kasus — hindari duplikasi literal.
const SAMPLE_ACTION: NextAction = {
  label: "Verifikasi 5 dokumen",
  description: "Ada 5 pendaftar dengan dokumen menunggu verifikasi.",
  href: "/sch/$sekolah/akademik/ppdb/dokumen",
  tone: "warning",
};

/** Default renderLink: anchor sederhana agar href dapat diperiksa di DOM. */
function anchorLink(href: string, children: ReactNode): ReactNode {
  return <a href={href}>{children}</a>;
}

describe("NextActionCard", () => {
  afterEach(() => cleanup());

  it("menampilkan judul, label, dan deskripsi aksi", () => {
    render(<NextActionCard action={SAMPLE_ACTION} renderLink={anchorLink} />);
    expect(screen.getByText(/langkah berikutnya/i)).toBeInTheDocument();
    expect(screen.getByText("Verifikasi 5 dokumen")).toBeInTheDocument();
    expect(
      screen.getByText(/5 pendaftar dengan dokumen menunggu verifikasi/i),
    ).toBeInTheDocument();
  });

  it("memanggil renderLink dengan href aksi", () => {
    const renderLink = vi.fn((href: string, children: ReactNode) => (
      <a href={href}>{children}</a>
    ));
    render(<NextActionCard action={SAMPLE_ACTION} renderLink={renderLink} />);
    expect(renderLink).toHaveBeenCalledWith(
      "/sch/$sekolah/akademik/ppdb/dokumen",
      expect.anything(),
    );
    // CTA harus terhubung ke href yang diberikan.
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/sch/$sekolah/akademik/ppdb/dokumen");
  });

  it("tidak merender apa pun saat action null", () => {
    const { container } = render(
      <NextActionCard action={null} renderLink={anchorLink} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/langkah berikutnya/i)).not.toBeInTheDocument();
  });
});
