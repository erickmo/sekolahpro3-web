import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { SiswaGettingStarted } from "./SiswaGettingStarted";

// SiswaGettingStarted renders a TanStack <Link>; stub it to a plain anchor so
// the test needs no router context and can assert the resolved href directly.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

// globals:false → no automatic cleanup; unmount between tests to avoid leaks.
afterEach(cleanup);

describe("SiswaGettingStarted", () => {
  it("renders the title, description, and steps", () => {
    render(
      <SiswaGettingStarted
        sekolah="sd-merdeka"
        title="Belum ada siswa"
        description="Mulai dengan menambahkan siswa pertama."
        steps={["Langkah satu", "Langkah dua"]}
        primaryAction={{ label: "Tambah Siswa", href: "/sch/$sekolah/siswa/new" }}
      />,
    );
    expect(screen.getByText("Belum ada siswa")).toBeInTheDocument();
    expect(screen.getByText("Mulai dengan menambahkan siswa pertama.")).toBeInTheDocument();
    expect(screen.getByText("Langkah satu")).toBeInTheDocument();
    expect(screen.getByText("Langkah dua")).toBeInTheDocument();
  });

  it("resolves the $sekolah token in the primary action href", () => {
    render(
      <SiswaGettingStarted
        sekolah="sd-merdeka"
        title="Belum ada siswa"
        primaryAction={{ label: "Tambah Siswa", href: "/sch/$sekolah/siswa/new" }}
      />,
    );
    const link = screen.getByRole("link", { name: "Tambah Siswa" });
    expect(link.getAttribute("href")).toBe("/sch/sd-merdeka/siswa/new");
  });

  it("renders a secondary action when supplied", () => {
    render(
      <SiswaGettingStarted
        sekolah="sd-merdeka"
        title="Belum ada siswa"
        primaryAction={{ label: "Tambah Siswa", href: "/sch/$sekolah/siswa/new" }}
        secondaryAction={{ label: "Import", href: "/sch/$sekolah/siswa/daftar" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Import" })).toBeInTheDocument();
  });
});
