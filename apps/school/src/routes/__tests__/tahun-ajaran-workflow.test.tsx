import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { TahunAjaranWorkflow } from "../sch.$sekolah.master.tahun-ajaran.$name";

afterEach(cleanup);

const base = { name: "SD-X-2025/2026", nama: "2025/2026" };

describe("TahunAjaranWorkflow", () => {
  it("shows Aktifkan when status is not Aktif (Draft)", () => {
    render(<TahunAjaranWorkflow doc={{ ...base, status: "Draft" }} refresh={() => {}} />);
    expect(screen.getByRole("button", { name: /aktifkan/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /tutup/i })).toBeNull();
  });

  it("shows Tutup when status is Aktif", () => {
    render(<TahunAjaranWorkflow doc={{ ...base, status: "Aktif" }} refresh={() => {}} />);
    expect(screen.getByRole("button", { name: /tutup tahun ajaran/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /aktifkan/i })).toBeNull();
  });

  it("shows the 'Sedang berjalan' badge when is_current", () => {
    render(
      <TahunAjaranWorkflow doc={{ ...base, status: "Aktif", is_current: 1 }} refresh={() => {}} />,
    );
    expect(screen.getByText(/sedang berjalan/i)).toBeTruthy();
  });
});
