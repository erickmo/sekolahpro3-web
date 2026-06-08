import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { AntreanKeputusan, type MutasiQueueRow } from "../AntreanKeputusan";

afterEach(cleanup);

const rows: MutasiQueueRow[] = [
  { name: "M1", siswa: "Andi", jenis_mutasi: "Pindah Keluar", workflow_state: "Pending Kepsek" },
  { name: "M2", siswa: "Budi", jenis_mutasi: "Drop Out", workflow_state: "Pending Kepsek" },
];

describe("AntreanKeputusan", () => {
  it("lists each pending mutasi with its student and jenis", () => {
    render(<AntreanKeputusan items={rows} onSelect={() => {}} />);
    expect(screen.getByText("Andi")).toBeTruthy();
    expect(screen.getByText("Budi")).toBeTruthy();
    expect(screen.getAllByText(/destruktif/i).length).toBeGreaterThan(0);
  });

  it("calls onSelect with the row name when a row is clicked", () => {
    const onSelect = vi.fn();
    render(<AntreanKeputusan items={rows} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Andi"));
    expect(onSelect).toHaveBeenCalledWith("M1");
  });

  it("shows an empty state when the queue is empty", () => {
    render(<AntreanKeputusan items={[]} onSelect={() => {}} />);
    expect(screen.getByText(/tidak ada/i)).toBeTruthy();
  });
});
