/**
 * Unit tests for TahunChip — the passive Tahun Ajaran chip for date-driven
 * surfaces (daily attendance). Its defining property (debate critic #1): it
 * renders NO clickable control, so it never competes with the page's primary
 * action (mark-present). Just a label + optional hint + optional role badge.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { TahunChip } from "./TahunChip";

afterEach(() => cleanup());

describe("TahunChip", () => {
  it("shows the Tahun Ajaran label", () => {
    render(<TahunChip label="2025/2026" />);
    expect(screen.getByText(/2025\/2026/)).toBeTruthy();
  });

  it("shows the passive hint when given", () => {
    render(<TahunChip label="2025/2026" hint="otomatis ikut tanggal" />);
    expect(screen.getByText(/otomatis ikut tanggal/i)).toBeTruthy();
  });

  it("shows the optional role label", () => {
    render(<TahunChip label="2025/2026" roleLabel="Guru" />);
    expect(screen.getByText("Guru")).toBeTruthy();
  });

  it("renders NO clickable control (no dropdown, no button) — critic #1", () => {
    render(<TahunChip label="2025/2026" hint="otomatis ikut tanggal" roleLabel="Guru" />);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
