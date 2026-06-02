import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

// ForbiddenPage is reached when RequireAuth denies a signed-in user who lacks
// the "SekolahPro Admin" role. Router + auth.logout are mocked.
const mockNavigate = vi.fn();
const mockLogout = vi.fn();

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@sekolahpro/auth", () => ({
  logout: (...args: unknown[]) => mockLogout(...args),
}));

import { ForbiddenPage } from "./403";

describe("ForbiddenPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogout.mockReset();
  });
  afterEach(() => cleanup());

  it("render kode 403 dan judul akses ditolak", () => {
    render(<ForbiddenPage />);
    expect(screen.getByText("403")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Akses ditolak/ })).toBeTruthy();
  });

  it("tombol keluar memanggil logout lalu navigasi ke login", async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    render(<ForbiddenPage />);
    fireEvent.click(screen.getByRole("button", { name: /Keluar/ }));
    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" }));
  });
});
