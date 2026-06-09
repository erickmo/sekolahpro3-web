/**
 * Unit tests for StripTahun — the read-only Tahun Ajaran context strip.
 * Props-only/presentational, so these render it directly with no provider.
 * Pin: eyebrow, status badge per (isPastPeriod, noActiveTa), the archive/no-TA
 * banners, and the optional taLabel / roleLabel / note slots.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StripTahun } from "./StripTahun";

afterEach(() => cleanup());

describe("StripTahun", () => {
  it("shows the module eyebrow and a 'berjalan' badge with no banner when active", () => {
    render(<StripTahun moduleLabel="Jadwal" taLabel="2025/2026" isPastPeriod={false} noActiveTa={false} />);
    expect(screen.getByText("Konteks Jadwal")).toBeTruthy();
    expect(screen.getByText("Periode berjalan")).toBeTruthy();
    expect(screen.queryByText(/membuka periode lampau/i)).toBeNull();
    expect(screen.queryByText(/Belum ada Tahun Ajaran aktif/i)).toBeNull();
  });

  it("renders the read-only TA label when given, and omits it when not", () => {
    const { rerender } = render(
      <StripTahun moduleLabel="Jadwal" taLabel="2025/2026" isPastPeriod={false} noActiveTa={false} />,
    );
    expect(screen.getByText("2025/2026")).toBeTruthy();
    rerender(<StripTahun moduleLabel="Jadwal" isPastPeriod={false} noActiveTa={false} />);
    expect(screen.queryByText("2025/2026")).toBeNull();
  });

  it("shows the 'lampau' badge + archive banner when the period is past", () => {
    render(<StripTahun moduleLabel="Jadwal" taLabel="2024/2025" isPastPeriod={true} noActiveTa={false} />);
    expect(screen.getByText("Periode lampau")).toBeTruthy();
    expect(screen.getByText(/membuka periode lampau/i)).toBeTruthy();
  });

  it("shows the 'belum-aktif' badge + setup banner when no active TA", () => {
    render(<StripTahun moduleLabel="Jadwal" isPastPeriod={false} noActiveTa={true} />);
    expect(screen.getByText("Belum ada TA aktif")).toBeTruthy();
    expect(screen.getByText(/Belum ada Tahun Ajaran aktif/i)).toBeTruthy();
  });

  it("renders the optional role label and clarifying note", () => {
    render(
      <StripTahun
        moduleLabel="Jadwal"
        taLabel="2025/2026"
        isPastPeriod={false}
        noActiveTa={false}
        roleLabel="Tata Usaha"
        note="Daftar di bawah menampilkan semua tahun ajaran."
      />,
    );
    expect(screen.getByText("Tata Usaha")).toBeTruthy();
    expect(screen.getByText(/menampilkan semua tahun ajaran/i)).toBeTruthy();
  });

  it("renders TA as a dropdown (not a read-only badge) when taSwitch is given", () => {
    render(
      <StripTahun
        moduleLabel="Jadwal"
        taSwitch={{ value: "S-2025", options: [{ value: "S-2025", label: "2025/2026" }], onChange: () => {} }}
        isPastPeriod={false}
        noActiveTa={false}
      />,
    );
    // The TA control is now a labelled combobox, not a static badge.
    expect(screen.getByLabelText("Tahun Ajaran")).toBeTruthy();
  });

  it("renders a Semester dropdown when semesterSwitch is given", () => {
    render(
      <StripTahun
        moduleLabel="Jadwal"
        semesterSwitch={{ value: "Ganjil", options: [{ value: "Ganjil", label: "Ganjil" }], onChange: () => {} }}
        isPastPeriod={false}
        noActiveTa={false}
      />,
    );
    expect(screen.getByLabelText("Semester")).toBeTruthy();
  });
});
