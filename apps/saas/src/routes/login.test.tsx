import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

// LoginPage depends on the router (useNavigate / Navigate) and the auth service
// (login / useSession). Both are mocked so the component is exercised in
// isolation; createFileRoute is kept real (module-load only, no router needed).
const mockNavigate = vi.fn();
const mockLogin = vi.fn();
let mockSession: { status: string } = { status: "guest" };

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

vi.mock("@sekolahpro/auth", () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  useSession: () => mockSession,
}));

import { LoginPage } from "./login";

function fillCredentials(usr: string, pwd: string) {
  fireEvent.change(screen.getByLabelText("Username atau email"), { target: { value: usr } });
  fireEvent.change(screen.getByLabelText("Kata sandi"), { target: { value: pwd } });
}

describe("LoginPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogin.mockReset();
    mockSession = { status: "guest" };
  });
  afterEach(() => cleanup());

  it("render judul dan subjudul brand", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /Masuk ke SekolahPro/ })).toBeTruthy();
    expect(screen.getByText(/Kelola seluruh sekolah Anda/)).toBeTruthy();
  });

  it("autofocus ke field username saat dimuat (G4)", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Username atau email")).toBe(document.activeElement);
  });

  it("toggle tampilkan/sembunyikan kata sandi", () => {
    render(<LoginPage />);
    const pwd = screen.getByLabelText("Kata sandi") as HTMLInputElement;
    expect(pwd.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Tampilkan" }));
    expect(pwd.type).toBe("text");
    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan" }));
    expect(pwd.type).toBe("password");
  });

  it("submit memanggil login lalu navigasi ke dashboard", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />);
    fillCredentials("admin", "rahasia");
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("admin", "rahasia"));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: "/" }));
  });

  it("tampilkan pesan error humane saat login gagal", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Email atau kata sandi salah. Coba lagi."));
    render(<LoginPage />);
    fillCredentials("admin", "salah");
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Email atau kata sandi salah");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("tombol disabled dan berlabel memproses selama login berjalan", async () => {
    let resolveLogin: () => void = () => {};
    mockLogin.mockImplementationOnce(
      () => new Promise<void>((r) => { resolveLogin = r; }),
    );
    render(<LoginPage />);
    fillCredentials("admin", "rahasia");
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    const busyBtn = await screen.findByRole("button", { name: "Memproses..." });
    expect((busyBtn as HTMLButtonElement).disabled).toBe(true);
    resolveLogin();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: "/" }));
  });

  it("redirect ke dashboard bila sudah terautentikasi (G3)", () => {
    mockSession = { status: "authenticated" };
    render(<LoginPage />);
    expect(screen.getByTestId("navigate").getAttribute("data-to")).toBe("/");
    expect(screen.queryByRole("heading", { name: /Masuk ke SekolahPro/ })).toBeNull();
  });
});
