import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("@sekolahpro/auth", () => ({ useSession: vi.fn() }));
import { useSession } from "@sekolahpro/auth";
import { PerpustakaanContextBar } from "../PerpustakaanContextBar";

function mockRoles(roles: string[] | null) {
  if (roles === null) {
    vi.mocked(useSession).mockImplementationOnce(() => {
      throw new Error("no provider");
    });
    return;
  }
  vi.mocked(useSession).mockReturnValue({ roles } as never);
}

describe("PerpustakaanContextBar", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(useSession).mockReset();
  });

  it("shows the circulation-staff role label + focus for a petugas", () => {
    mockRoles(["Petugas Perpustakaan"]);
    render(<PerpustakaanContextBar />);
    expect(screen.getByText("Petugas Sirkulasi")).toBeTruthy();
    expect(screen.getByText(/sirkulasi harian/i)).toBeTruthy();
  });

  it("shows the head-librarian focus for a pustakawan", () => {
    mockRoles(["Kepala Perpustakaan"]);
    render(<PerpustakaanContextBar />);
    expect(screen.getByText("Kepala Perpustakaan")).toBeTruthy();
    expect(screen.getByText(/pengawasan|approval|laporan/i)).toBeTruthy();
  });

  it("renders the provided CTA slot", () => {
    mockRoles(["Petugas Perpustakaan"]);
    render(<PerpustakaanContextBar cta={<button type="button">Buka Terminal</button>} />);
    expect(screen.getByRole("button", { name: "Buka Terminal" })).toBeTruthy();
  });

  it("defaults to petugas framing when no session/role is available", () => {
    mockRoles(null);
    render(<PerpustakaanContextBar />);
    expect(screen.getByText("Petugas Sirkulasi")).toBeTruthy();
  });
});
