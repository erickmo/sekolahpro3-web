import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// FasilitasExpanded reads the parent Ruangan doc (child rows embedded) instead
// of querying the child doctype directly — verify the three render states.
let docResult: { data?: { fasilitas?: unknown[] }; isLoading?: boolean } = {};
vi.mock("@sekolahpro/api-client", () => ({
  useResourceDoc: () => docResult,
  useResourceList: () => ({ data: [] }),
  useResourceDelete: () => ({ mutateAsync: vi.fn() }),
}));

import { FasilitasExpanded } from "./sch.$sekolah.infrastruktur.daftar-gedung.$gedungId";

describe("FasilitasExpanded", () => {
  afterEach(() => cleanup());

  it("tampilkan loading saat doc dimuat", () => {
    docResult = { isLoading: true };
    render(<FasilitasExpanded ruanganName="R1" />);
    expect(screen.getByText("Memuat fasilitas…")).toBeTruthy();
  });

  it("tampilkan pesan kosong saat fasilitas tidak ada", () => {
    docResult = { data: { fasilitas: [] }, isLoading: false };
    render(<FasilitasExpanded ruanganName="R1" />);
    expect(screen.getByText(/Belum ada fasilitas/)).toBeTruthy();
  });

  it("render daftar fasilitas dari child table doc induk", () => {
    docResult = {
      data: { fasilitas: [{ name: "f1", nama_fasilitas: "Kursi", jumlah: 20, kondisi: "Baik" }] },
      isLoading: false,
    };
    render(<FasilitasExpanded ruanganName="R1" />);
    expect(screen.getByText("Kursi")).toBeTruthy();
    expect(screen.getByText(/Jumlah: 20/)).toBeTruthy();
  });
});
