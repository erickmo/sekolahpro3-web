import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ModuleContextBar } from "../ModuleContextBar";

// globals:false in vitest.config means afterEach(cleanup) is NOT auto-wired.
afterEach(cleanup);

describe("ModuleContextBar", () => {
  it("renders the 'Konteks {label}' eyebrow", () => {
    render(<ModuleContextBar label="Absensi" />);
    expect(screen.getByText("Konteks Absensi")).toBeInTheDocument();
  });

  it("renders the framing line when provided", () => {
    render(<ModuleContextBar label="Absensi" framing="Pantau kehadiran harian." />);
    expect(screen.getByText("Pantau kehadiran harian.")).toBeInTheDocument();
  });

  it("renders the role badge when roleLabel is provided", () => {
    render(<ModuleContextBar label="Aset" roleLabel="Petugas Aset" />);
    expect(screen.getByText("Petugas Aset")).toBeInTheDocument();
  });

  it("omits the role badge when roleLabel is absent", () => {
    render(<ModuleContextBar label="Jadwal" />);
    expect(screen.queryByText(/Petugas/)).toBeNull();
  });

  it("renders the cta slot when provided", () => {
    render(<ModuleContextBar label="Perpustakaan" cta={<button>Terminal</button>} />);
    expect(screen.getByRole("button", { name: "Terminal" })).toBeInTheDocument();
  });
});
