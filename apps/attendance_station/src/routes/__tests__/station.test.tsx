// ABS-002 — layar tap stasiun (konfirmasi)
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StationView } from "../station";

// RTL cleanup tidak otomatis di repo ini (globals on, autoClean off).
afterEach(cleanup);

describe("StationView", () => {
  it("menampilkan nama dan label MASUK saat arah masuk", () => {
    render(<StationView lastTap={{ name: "Budi", direction: "in" }} />);

    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.getByText("MASUK")).toBeInTheDocument();
  });

  it("menampilkan label PULANG saat arah keluar", () => {
    render(<StationView lastTap={{ name: "Siti", direction: "out" }} />);

    expect(screen.getByText("Siti")).toBeInTheDocument();
    expect(screen.getByText("PULANG")).toBeInTheDocument();
  });

  it("menampilkan prompt idle saat tidak ada tap", () => {
    render(<StationView lastTap={null} />);

    expect(screen.getByText(/menunggu tap/i)).toBeInTheDocument();
  });
});
